#!/usr/bin/env bash
# SPDX-License-Identifier: GPL-3.0-or-later
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
SOURCE_DIR="$SCRIPT_DIR/sources"
BUILD_ROOT="${1:-${TMPDIR:-/tmp}/mgt-ffmpeg-9.0.1-build}"
JOBS="${JOBS:-4}"

for tool in tar sha256sum make meson ninja pkg-config nasm strings strip x86_64-w64-mingw32-gcc x86_64-w64-mingw32-gcc-ar x86_64-w64-mingw32-gcc-ranlib; do
  command -v "$tool" >/dev/null || { echo "Missing build tool: $tool" >&2; exit 2; }
done
if [[ -e "$BUILD_ROOT" ]]; then
  echo "Build directory already exists; choose a new empty path: $BUILD_ROOT" >&2
  exit 2
fi
(cd "$SOURCE_DIR" && sha256sum -c SHA256SUMS)

mkdir -p "$BUILD_ROOT/src/ffmpeg" "$BUILD_ROOT/src/x264" "$BUILD_ROOT/src/zlib" "$BUILD_ROOT/src/dav1d" "$BUILD_ROOT/deps" "$BUILD_ROOT/install"
tar -xJf "$SOURCE_DIR/ffmpeg-9.0.1-bf1b838f2a.tar.xz" -C "$BUILD_ROOT/src/ffmpeg" --strip-components=1
tar -xJf "$SOURCE_DIR/x264-0.165.3223-0480cb0.tar.xz" -C "$BUILD_ROOT/src/x264" --strip-components=1
tar -xzf "$SOURCE_DIR/zlib-1.3.2-da607da739.tar.gz" -C "$BUILD_ROOT/src/zlib" --strip-components=1
tar -xzf "$SOURCE_DIR/dav1d-1.5.4.tar.gz" -C "$BUILD_ROOT/src/dav1d" --strip-components=1

DEPS="$BUILD_ROOT/deps"
INSTALL="$BUILD_ROOT/install"
export PKG_CONFIG_PATH="$DEPS/lib/pkgconfig"

cat > "$BUILD_ROOT/dav1d-cross.ini" <<'CROSS_FILE'
[binaries]
c = 'x86_64-w64-mingw32-gcc'
ar = 'x86_64-w64-mingw32-gcc-ar'
strip = 'strip'
pkg-config = 'pkg-config'

[host_machine]
system = 'windows'
cpu_family = 'x86_64'
cpu = 'x86_64'
endian = 'little'

[properties]
needs_exe_wrapper = true
CROSS_FILE

meson setup "$BUILD_ROOT/dav1d-build" "$BUILD_ROOT/src/dav1d" \
  --cross-file "$BUILD_ROOT/dav1d-cross.ini" \
  --prefix=/ --default-library=static \
  -Denable_tools=false -Denable_tests=false -Denable_docs=false
ninja -C "$BUILD_ROOT/dav1d-build"
mkdir -p "$DEPS/include/dav1d" "$DEPS/lib/pkgconfig"
cp -a "$BUILD_ROOT/src/dav1d/include/dav1d/." "$DEPS/include/dav1d/"
install -m 644 "$BUILD_ROOT/dav1d-build/src/libdav1d.a" "$DEPS/lib/libdav1d.a"
cat > "$DEPS/lib/pkgconfig/dav1d.pc" <<'DAV1D_PC'
prefix=/
includedir=${prefix}/include
libdir=${prefix}/lib

Name: libdav1d
Description: AV1 decoding library
Version: 1.5.4
Libs: -L${libdir} -ldav1d
Cflags: -I${includedir}
DAV1D_PC
export PKG_CONFIG_SYSROOT_DIR="$DEPS"

cd "$BUILD_ROOT/src/zlib"
CHOST=x86_64-w64-mingw32 \
CC=x86_64-w64-mingw32-gcc \
AR=x86_64-w64-mingw32-gcc-ar \
RANLIB=x86_64-w64-mingw32-gcc-ranlib \
  ./configure --static --prefix="$DEPS"
make -j"$JOBS"
make install

cd "$BUILD_ROOT/src/x264"
STRINGS="$(command -v strings)" ./configure \
  --host=x86_64-w64-mingw32 \
  --cross-prefix=x86_64-w64-mingw32- \
  --prefix="$DEPS" \
  --enable-static \
  --disable-cli
make -j"$JOBS" STRIP="$(command -v strip)"
make install

cd "$BUILD_ROOT/src/ffmpeg"
./configure \
  --prefix=/ \
  --arch=x86_64 \
  --target-os=mingw32 \
  --cross-prefix=x86_64-w64-mingw32- \
  --cc=x86_64-w64-mingw32-gcc \
  --nm=nm --ar=ar --ranlib=ranlib --strip=strip \
  --pkg-config=pkg-config --pkg-config-flags=--static \
  --enable-gpl --enable-version3 --enable-libx264 --enable-libdav1d --enable-zlib \
  --disable-autodetect --enable-static --disable-shared \
  --disable-debug --disable-doc --disable-ffplay --disable-stripping \
  --extra-cflags=-I../../deps/include \
  --extra-ldflags='-L../../deps/lib -static'
make -j"$JOBS"
make DESTDIR="$INSTALL" install

"$INSTALL/bin/ffmpeg.exe" -version
"$INSTALL/bin/ffprobe.exe" -version
echo "Built binaries: $INSTALL/bin/ffmpeg.exe and $INSTALL/bin/ffprobe.exe"
