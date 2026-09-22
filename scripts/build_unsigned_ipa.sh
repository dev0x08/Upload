#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

command -v xcodegen >/dev/null || { echo "Missing xcodegen. Install with: brew install xcodegen"; exit 1; }
command -v xcodebuild >/dev/null || { echo "Missing Xcode/xcodebuild."; exit 1; }

OUT="$ROOT/build-output"
DERIVED="$OUT/DerivedData"
rm -rf "$OUT"
mkdir -p "$OUT"

xcodegen generate
xcodebuild   -project SpamSMSVipRebuild.xcodeproj   -scheme SpamSMSVipRebuild   -configuration Release   -sdk iphoneos   -derivedDataPath "$DERIVED"   CODE_SIGNING_ALLOWED=NO   CODE_SIGNING_REQUIRED=NO   CODE_SIGN_IDENTITY=""   clean build

APP="$DERIVED/Build/Products/Release-iphoneos/SpamSMS.app"
test -d "$APP"
mkdir -p "$OUT/ipa/Payload"
cp -R "$APP" "$OUT/ipa/Payload/"
(
  cd "$OUT/ipa"
  /usr/bin/zip -qry "$OUT/SpamSMSVip-unsigned.ipa" Payload
)

echo "Created: $OUT/SpamSMSVip-unsigned.ipa"
