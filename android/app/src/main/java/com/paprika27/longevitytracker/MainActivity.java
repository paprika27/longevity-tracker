package com.paprika27.longevitytracker;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Invalidate the webview cache to ensure the latest assets are loaded
    this.getBridge().getWebView().clearCache(true);
  }
}
