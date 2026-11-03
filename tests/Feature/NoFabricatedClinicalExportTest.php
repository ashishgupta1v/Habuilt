<?php

declare(strict_types=1);

namespace Tests\Feature;

use Tests\TestCase;

final class NoFabricatedClinicalExportTest extends TestCase
{
    public function test_biomarker_download_sources_do_not_invent_days_or_flare_labels(): void
    {
        foreach ([
            'resources/js/Components/Modals/DataBackupModal.vue',
            'resources/js/Components/Analytics/PerformanceAnalytics.vue',
            'resources/js/lib/biomarkerExport.js',
        ] as $relative) {
            $source = (string) file_get_contents(base_path($relative));
            $this->assertStringNotContainsString('FlareRisk', $source, $relative);
            $this->assertStringNotContainsString('Active Flare', $source, $relative);
            $this->assertStringNotContainsString('clinical team', $source, $relative);
            $this->assertStringNotContainsString('Math.sin', $source, $relative);
        }

        $hud = (string) file_get_contents(base_path('resources/js/Components/Intelligence/ZoetiCoachAdherenceHud.vue'));
        $this->assertStringNotContainsString('Elite Compliance', $hud);
        $this->assertStringNotContainsString('Compliance Telemetry', $hud);
        $this->assertStringNotContainsString('auto-syncing to ZoetiCoach', $hud);
    }
}
