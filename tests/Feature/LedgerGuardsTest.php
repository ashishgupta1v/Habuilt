<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\Ledger\CheckInDuplicateCollapser;
use App\Services\Ledger\SpaLedgerGuard;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class LedgerGuardsTest extends TestCase
{
    public function test_rls_sql_limits_rows_to_the_authenticated_owner(): void
    {
        $sql = (string) file_get_contents(base_path('database/sql/2026_11_02_row_level_security.sql'));
        $owner = $this->sqlSection($sql, 'owner_tables');
        $partner = $this->sqlSection($sql, 'partner_connections');

        $this->assertStringContainsString("'habit_check_ins'", $owner);
        $this->assertStringContainsString("'user_settings'", $owner);
        $this->assertStringContainsString("'user_protocols'", $owner);
        $this->assertStringContainsString("'user_biomarkers'", $owner);
        $this->assertStringContainsString("'user_monthly_states'", $owner);
        $this->assertStringContainsString('ENABLE ROW LEVEL SECURITY', $owner);
        $this->assertStringContainsString('auth.uid()::text = user_id::text', $owner);
        $this->assertStringContainsString('REVOKE ALL ON TABLE public.%I FROM anon', $owner);
        $this->assertStringNotContainsString('partner_user_id', $owner);
        $this->assertStringNotContainsString('TO anon', $owner);

        $this->assertStringContainsString('auth.uid()::text = user_id::text', $partner);
        $this->assertStringContainsString('auth.uid()::text = partner_user_id::text', $partner);
        $this->assertStringContainsString('NEW.user_id::text IS DISTINCT FROM OLD.user_id::text', $partner);
        $this->assertStringNotContainsString('habit_check_ins', $partner);
        $this->assertStringNotContainsString('USING (true)', strtolower($sql));
    }

    public function test_exact_duplicate_check_ins_collapse_to_the_newest_row(): void
    {
        $this->createCheckInTable();
        DB::table('habit_check_ins')->insert([
            $this->checkIn('old', 'user-a', 5, '2026-11-02 08:00:00'),
            $this->checkIn('new', 'user-a', 5, '2026-11-02 09:00:00'),
            $this->checkIn('other', 'user-b', 5, '2026-11-02 09:00:00'),
        ]);

        $result = (new CheckInDuplicateCollapser())->collapse();

        $this->assertSame(1, $result['collapsed_groups']);
        $this->assertFalse($result['aborted']);
        $this->assertSame('new', DB::table('habit_check_ins')->where('user_id', 'user-a')->value('id'));
        $this->assertSame('other', DB::table('habit_check_ins')->where('user_id', 'user-b')->value('id'));
    }

    public function test_conflicting_duplicate_check_ins_block_the_unique_constraint(): void
    {
        $this->createCheckInTable();
        DB::table('habit_check_ins')->insert([
            $this->checkIn('low', 'user-a', 5, '2026-11-02 08:00:00'),
            $this->checkIn('high', 'user-a', 9, '2026-11-02 09:00:00'),
        ]);

        $result = (new SpaLedgerGuard())->ensure();

        $this->assertTrue($result['collapse']['aborted']);
        $this->assertSame(1, $result['collapse']['conflicting_groups']);
        $this->assertSame('not_created', $result['unique_index']);
        $this->assertSame(2, DB::table('habit_check_ins')->where('user_id', 'user-a')->count());
        $indexes = DB::select("SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?", [SpaLedgerGuard::UNIQUE_INDEX]);
        $this->assertSame([], $indexes);
    }

    public function test_guard_creates_the_unique_index_the_api_upsert_uses(): void
    {
        $result = (new SpaLedgerGuard())->ensure();

        $this->assertSame(0, $result['collapse']['collapsed_groups']);
        $this->assertContains($result['unique_index'], ['created', 'exists']);
        $this->assertSame('skipped-not-pgsql', $result['rls']);

        DB::table('habit_check_ins')->insert($this->checkIn('one', 'user-a', 1, '2026-11-02 08:00:00'));

        $this->expectException(\Illuminate\Database\QueryException::class);
        DB::table('habit_check_ins')->insert($this->checkIn('two', 'user-a', 1, '2026-11-02 09:00:00'));
    }

    private function sqlSection(string $sql, string $name): string
    {
        $pattern = '/-- section:'.preg_quote($name, '/').'(.*?)-- endsection:'.preg_quote($name, '/').'/s';
        $this->assertSame(1, preg_match($pattern, $sql, $matches), 'Missing SQL section '.$name);

        return $matches[1];
    }

    private function createCheckInTable(): void
    {
        DB::statement('CREATE TABLE IF NOT EXISTS habit_check_ins (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            habit_id TEXT NOT NULL,
            habit_name TEXT,
            month_key TEXT NOT NULL,
            day INTEGER NOT NULL,
            completed_on DATE NOT NULL,
            points INTEGER NOT NULL DEFAULT 1,
            canonical_key TEXT,
            source TEXT DEFAULT "web",
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )');
    }

    /**
     * @return array<string, mixed>
     */
    private function checkIn(string $id, string $userId, int $points, string $updatedAt): array
    {
        return [
            'id' => $id,
            'user_id' => $userId,
            'habit_id' => 'hydrate',
            'habit_name' => 'Water',
            'month_key' => '2026-11',
            'day' => 2,
            'completed_on' => '2026-11-02',
            'points' => $points,
            'created_at' => $updatedAt,
            'updated_at' => $updatedAt,
        ];
    }
}
