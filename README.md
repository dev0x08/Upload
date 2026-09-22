# SpamSMSVip Rebuild

Reconstructed Objective-C/UIKit project prepared for building on GitHub Actions without owning a Mac.

## Build
1. Open **Actions**.
2. Run **Build iOS IPA**.
3. Download the artifact `SpamSMSVip-unsigned-<run number>`.

The repository stores the reconstructed source in `project-source.zip`; the workflow extracts it before generating the Xcode project with XcodeGen.

The network layer in this rebuild is a mock/test implementation and does not reproduce third-party OTP/SMS traffic.
