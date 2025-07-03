import { APP_MODE } from "../../config";

export const appInfo = {
  build: null,
  version: null,
  async init()
  {
    if (APP_MODE === "1")
    {
      this.build = "1.3";
      this.version = "3.7.0";
      return;
    }
    const { default: deviceInfo } = await import("react-native-device-info");
    this.build = deviceInfo.getBuildNumber();
    this.version = deviceInfo.getVersion();
  },
};
