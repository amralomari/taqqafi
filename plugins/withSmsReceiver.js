const { withAndroidManifest } = require("@expo/config-plugins");

function withSmsReceiver(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const perms = [
      "android.permission.RECEIVE_SMS",
      "android.permission.READ_SMS",
    ];
    for (const perm of perms) {
      if (
        !manifest["uses-permission"].some((p) => p.$["android:name"] === perm)
      ) {
        manifest["uses-permission"].push({ $: { "android:name": perm } });
      }
    }

    return config;
  });
}

module.exports = withSmsReceiver;
