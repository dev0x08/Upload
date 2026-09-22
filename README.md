# SpamSMSVip Rebuild

Source has been expanded directly in this repository so files can be edited and pushed normally.

- Native Objective-C + UIKit reconstruction.
- Main code is under `SpamSMSVip/`.
- The network layer is a mock/test implementation and does not reproduce third-party OTP/SMS traffic.
- IPA build is **manual only**. Pushing code does not trigger a build.
- When an IPA is needed, run **Actions → Build iOS IPA → Run workflow**.

## Structure

```
SpamSMSVip/
├── AppDelegate.h/.m
├── SceneDelegate.h/.m
├── ViewController.h/.m
├── OpenLinkPopup.h/.m
├── MockRequestService.h/.m
├── Info.plist
├── main.m
└── Resources/
project.yml
scripts/build_unsigned_ipa.sh
.github/workflows/build-ios.yml
```
