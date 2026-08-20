package com.habuilt.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.habuilt.app.plugin.HabuiltWidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HabuiltWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
