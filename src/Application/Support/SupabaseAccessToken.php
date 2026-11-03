<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Verifies a Supabase access token.
 * Today's HS256 tokens still use the shared secret.
 * Asymmetric tokens are checked against the project JWKS when it can be fetched.
 * alg "none" and every other algorithm are rejected.
 */
final class SupabaseAccessToken
{
    /**
     * @return array{ok: bool, sub: string, error: string}
     */
    public function verify(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3 || $parts[0] === '' || $parts[1] === '') {
            return $this->fail('Unauthenticated: Malformed token structure');
        }

        [$headerB64, $payloadB64, $sigB64] = $parts;
        $header = json_decode($this->base64UrlDecode($headerB64), true);
        $payload = json_decode($this->base64UrlDecode($payloadB64), true);

        if (!is_array($header) || !is_array($payload) || !isset($payload['sub']) || !is_string($payload['sub']) || $payload['sub'] === '') {
            return $this->fail('Unauthenticated: Invalid token payload');
        }

        $alg = $header['alg'] ?? null;
        if (!is_string($alg) || strcasecmp($alg, 'none') === 0) {
            return $this->fail('Unauthenticated: Unsupported token algorithm');
        }

        if (isset($payload['exp']) && is_numeric($payload['exp']) && (int) $payload['exp'] < time()) {
            return $this->fail('Unauthenticated: Token has expired');
        }

        $alg = strtoupper($alg);
        if ($alg === 'HS256') {
            return $this->verifyHs256($headerB64, $payloadB64, $sigB64, $payload['sub']);
        }

        if ($alg === 'RS256' || $alg === 'ES256') {
            return $this->verifyAsymmetric($alg, $header, $payload, $headerB64.'.'.$payloadB64, $sigB64);
        }

        return $this->fail('Unauthenticated: Unsupported token algorithm');
    }

    /**
     * @return array{ok: bool, sub: string, error: string}
     */
    private function verifyHs256(string $headerB64, string $payloadB64, string $sigB64, string $subject): array
    {
        $secret = (string) config('services.supabase.jwt_secret', '');
        if ($secret === '') {
            return $this->fail('Unauthenticated: JWT verification is not configured');
        }

        $expected = hash_hmac('sha256', $headerB64.'.'.$payloadB64, $secret, true);
        $actual = $this->base64UrlDecode($sigB64);
        if ($actual === '' || strlen($actual) !== strlen($expected) || !hash_equals($expected, $actual)) {
            return $this->fail('Unauthenticated: Invalid cryptographic signature');
        }

        return ['ok' => true, 'sub' => $subject, 'error' => ''];
    }

    /**
     * @param array<string, mixed> $header
     * @param array<string, mixed> $payload
     * @return array{ok: bool, sub: string, error: string}
     */
    private function verifyAsymmetric(string $alg, array $header, array $payload, string $signingInput, string $sigB64): array
    {
        $issuer = $this->expectedIssuer();
        if ($issuer === '' || (string) ($payload['iss'] ?? '') !== $issuer) {
            return $this->fail('Unauthenticated: Invalid cryptographic signature');
        }

        $jwks = $this->jwks();
        if ($jwks === null) {
            return $this->fail('Unauthenticated: Invalid cryptographic signature');
        }

        $signature = $this->base64UrlDecode($sigB64);
        if ($signature === '') {
            return $this->fail('Unauthenticated: Invalid cryptographic signature');
        }
        if ($alg === 'ES256') {
            $signature = $this->ecdsaDer($signature);
            if ($signature === '') {
                return $this->fail('Unauthenticated: Invalid cryptographic signature');
            }
        }

        $kid = isset($header['kid']) && is_string($header['kid']) ? $header['kid'] : '';
        foreach ($jwks as $jwk) {
            if (!is_array($jwk)) {
                continue;
            }
            if ($kid !== '' && (string) ($jwk['kid'] ?? '') !== $kid) {
                continue;
            }
            $pem = $this->jwkToPem($jwk, $alg);
            if ($pem === null) {
                continue;
            }
            $verified = openssl_verify($signingInput, $signature, $pem, OPENSSL_ALGO_SHA256);
            if ($verified === 1) {
                return ['ok' => true, 'sub' => (string) $payload['sub'], 'error' => ''];
            }
        }

        return $this->fail('Unauthenticated: Invalid cryptographic signature');
    }

    private function expectedIssuer(): string
    {
        $base = rtrim(trim((string) config('services.supabase.url', '')), '/');
        if ($base === '') {
            return '';
        }

        return $base.'/auth/v1';
    }

    /**
     * @return array<int, mixed>|null
     */
    private function jwks(): ?array
    {
        $cached = Cache::get('habuilt.supabase.jwks');
        if (is_array($cached) && isset($cached['keys']) && is_array($cached['keys'])) {
            return $cached['keys'];
        }

        $url = trim((string) config('services.supabase.jwks_url', ''));
        if ($url === '') {
            $base = rtrim(trim((string) config('services.supabase.url', '')), '/');
            if ($base === '') {
                return null;
            }
            $url = $base.'/auth/v1/.well-known/jwks.json';
        }

        try {
            $response = Http::timeout(4)->acceptJson()->get($url);
        } catch (\Throwable) {
            return null;
        }

        if (!$response->successful()) {
            return null;
        }

        $body = $response->json();
        if (!is_array($body) || !isset($body['keys']) || !is_array($body['keys'])) {
            return null;
        }

        Cache::put('habuilt.supabase.jwks', $body, 600);

        return $body['keys'];
    }

    /**
     * @param array<string, mixed> $jwk
     */
    private function jwkToPem(array $jwk, string $alg): ?string
    {
        $kty = (string) ($jwk['kty'] ?? '');
        if ($alg === 'RS256' && $kty === 'RSA' && isset($jwk['n'], $jwk['e']) && is_string($jwk['n']) && is_string($jwk['e'])) {
            $n = $this->base64UrlDecode($jwk['n']);
            $e = $this->base64UrlDecode($jwk['e']);
            if ($n === '' || $e === '') {
                return null;
            }
            $rsa = $this->asn1(0x30, $this->asn1Integer($n).$this->asn1Integer($e));
            $bit = "\x03".$this->asn1Length(strlen($rsa) + 1)."\x00".$rsa;
            $algorithm = hex2bin('300d06092a864886f70d0101010500');
            if ($algorithm === false) {
                return null;
            }

            return $this->pem($this->asn1(0x30, $algorithm.$bit));
        }

        if ($alg === 'ES256' && $kty === 'EC' && (string) ($jwk['crv'] ?? '') === 'P-256' && isset($jwk['x'], $jwk['y']) && is_string($jwk['x']) && is_string($jwk['y'])) {
            $x = $this->pad32($this->base64UrlDecode($jwk['x']));
            $y = $this->pad32($this->base64UrlDecode($jwk['y']));
            if (strlen($x) !== 32 || strlen($y) !== 32) {
                return null;
            }
            $point = "\x04".$x.$y;
            $bit = "\x03".$this->asn1Length(strlen($point) + 1)."\x00".$point;
            $algorithm = hex2bin('301306072a8648ce3d020106082a8648ce3d030107');
            if ($algorithm === false) {
                return null;
            }

            return $this->pem($this->asn1(0x30, $algorithm.$bit));
        }

        return null;
    }

    private function ecdsaDer(string $raw): string
    {
        if (strlen($raw) !== 64) {
            return '';
        }
        $r = $this->asn1Integer(substr($raw, 0, 32));
        $s = $this->asn1Integer(substr($raw, 32, 32));

        return $this->asn1(0x30, $r.$s);
    }

    private function pad32(string $bytes): string
    {
        if (strlen($bytes) > 32) {
            $bytes = substr($bytes, -32);
        }

        return str_pad($bytes, 32, "\x00", STR_PAD_LEFT);
    }

    private function asn1Integer(string $bytes): string
    {
        $bytes = ltrim($bytes, "\x00");
        if ($bytes === '') {
            $bytes = "\x00";
        }
        if ((ord($bytes[0]) & 0x80) !== 0) {
            $bytes = "\x00".$bytes;
        }

        return $this->asn1(0x02, $bytes);
    }

    private function asn1(int $tag, string $value): string
    {
        return chr($tag).$this->asn1Length(strlen($value)).$value;
    }

    private function asn1Length(int $length): string
    {
        if ($length < 128) {
            return chr($length);
        }
        $encoded = '';
        while ($length > 0) {
            $encoded = chr($length & 0xff).$encoded;
            $length >>= 8;
        }

        return chr(0x80 | strlen($encoded)).$encoded;
    }

    private function pem(string $der): string
    {
        return "-----BEGIN PUBLIC KEY-----\n".chunk_split(base64_encode($der), 64, "\n")."-----END PUBLIC KEY-----\n";
    }

    /**
     * @return array{ok: bool, sub: string, error: string}
     */
    private function fail(string $error): array
    {
        return ['ok' => false, 'sub' => '', 'error' => $error];
    }

    private function base64UrlDecode(string $input): string
    {
        $remainder = strlen($input) % 4;
        if ($remainder !== 0) {
            $input .= str_repeat('=', 4 - $remainder);
        }
        $decoded = base64_decode(strtr($input, '-_', '+/'), true);

        return $decoded === false ? '' : $decoded;
    }
}
