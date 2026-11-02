<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Support\CurrentUserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Forwards the signed-in user's habit events to ZoetiCoach.
 * The bearer credential is read from server config and is never accepted from the client.
 */
final class ZoetiCoachProxyController
{
    public function storeEvent(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId === null) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $config = $this->serverCredential();
        if ($config === null) {
            return response()->json([
                'success' => true,
                'skipped' => true,
                'disabled' => true,
                'reason' => 'ZoetiCoach integration is disabled',
            ]);
        }

        $habitId = substr((string) $request->input('habit_id', ''), 0, 128);
        $points = max(0, min(100, (int) $request->input('points', 1)));
        $payload = [
            'external_participant_id' => $userId,
            'event_type' => substr((string) $request->input('event_type', 'habit_completed'), 0, 64),
            'event_value' => substr((string) $request->input('event_value', $habitId), 0, 200),
            'unit' => substr((string) $request->input('unit', 'session'), 0, 32),
            'occurred_at' => substr((string) ($request->input('occurred_at') ?: now()->toIso8601String()), 0, 40),
            'payload' => [
                'habit_id' => $habitId,
                'points' => $points,
                'source' => substr((string) $request->input('source', 'web'), 0, 32),
                'app' => 'habuilt',
            ],
        ];

        try {
            $response = Http::timeout(8)
                ->withToken($config['key'])
                ->acceptJson()
                ->post($config['url'].'/api/v3/habit-cloud/events', $payload);
        } catch (\Throwable) {
            return response()->json([
                'success' => false,
                'skipped' => false,
                'error' => 'ZoetiCoach could not be reached',
            ], 502);
        }

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'skipped' => false,
                'upstream_status' => $response->status(),
            ], 502);
        }

        return response()->json([
            'success' => true,
            'skipped' => false,
        ]);
    }

    public function adherence(Request $request): JsonResponse
    {
        $userId = $this->actor($request);
        if ($userId === null) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $config = $this->serverCredential();
        if ($config === null) {
            return response()->json([
                'success' => true,
                'skipped' => true,
                'disabled' => true,
                'reason' => 'ZoetiCoach integration is disabled',
                'data' => null,
            ]);
        }

        $days = max(1, min(365, (int) $request->query('days', 30)));

        try {
            $response = Http::timeout(8)
                ->withToken($config['key'])
                ->acceptJson()
                ->get($config['url'].'/api/v3/habit-cloud/adherence/'.rawurlencode($userId), [
                    'days' => $days,
                ]);
        } catch (\Throwable) {
            return response()->json([
                'success' => false,
                'skipped' => false,
                'error' => 'ZoetiCoach could not be reached',
                'data' => null,
            ], 502);
        }

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'skipped' => false,
                'upstream_status' => $response->status(),
                'data' => null,
            ], 502);
        }

        $json = $response->json();
        $data = is_array($json) ? ($json['data'] ?? $json) : null;

        return response()->json([
            'success' => true,
            'skipped' => false,
            'data' => $data,
        ]);
    }

    /**
     * @return array{url: string, key: string}|null
     */
    private function serverCredential(): ?array
    {
        $key = trim((string) config('services.zoeticoach.api_key', ''));
        $url = rtrim(trim((string) config('services.zoeticoach.api_url', '')), '/');
        if ($key === '' || $url === '') {
            return null;
        }

        return ['url' => $url, 'key' => $key];
    }

    private function actor(Request $request): ?string
    {
        $subject = trim((string) $request->attributes->get('auth_user_id', ''));
        if ($subject === '' || CurrentUserResolver::isGuestSubject($subject)) {
            return null;
        }

        return $subject;
    }
}
