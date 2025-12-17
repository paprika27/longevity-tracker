package com.paprika27.longevitytracker;

import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // During development, enable debugging and clear the cache on each run.
        boolean isDebuggable = (0 != (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE));
        if (isDebuggable) {
            WebView.setWebContentsDebuggingEnabled(true);
            getBridge().getWebView().clearCache(true);
        }
    }
}
