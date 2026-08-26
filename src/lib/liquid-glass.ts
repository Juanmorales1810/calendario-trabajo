// Port of the displacement-map technique from https://github.com/nikdelvin/liquid-glass
// (LiquidGlass.astro / utils/liquidGlass.ts), trimmed to the single-channel case (no
// chromatic aberration) since nothing here needs it.
type Options = {
    width: number;
    height: number;
    radius: number;
    depth?: number;
    strength?: number;
};

function getDisplacementMap({ width, height, radius, depth = 10 }: Options) {
    return (
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <style>.mix{mix-blend-mode:screen}</style>
    <defs>
        <linearGradient id="Y" x1="0" x2="0" y1="${Math.ceil((radius / height) * 15)}%" y2="${Math.floor(100 - (radius / height) * 15)}%">
            <stop offset="0%" stop-color="#0F0" /><stop offset="100%" stop-color="#000" />
        </linearGradient>
        <linearGradient id="X" x1="${Math.ceil((radius / width) * 15)}%" x2="${Math.floor(100 - (radius / width) * 15)}%" y1="0" y2="0">
            <stop offset="0%" stop-color="#F00" /><stop offset="100%" stop-color="#000" />
        </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="#808080" />
    <g filter="blur(2px)">
        <rect width="${width}" height="${height}" fill="#000080" />
        <rect width="${width}" height="${height}" fill="url(#Y)" class="mix" />
        <rect width="${width}" height="${height}" fill="url(#X)" class="mix" />
        <rect x="${depth}" y="${depth}" width="${width - 2 * depth}" height="${height - 2 * depth}" rx="${radius}" ry="${radius}" fill="#808080" filter="blur(${depth}px)" />
    </g>
</svg>`)
    );
}

export function getLiquidGlassFilter({
    width,
    height,
    radius,
    depth = 10,
    strength = 80,
}: Options) {
    const map = getDisplacementMap({ width, height, radius, depth });
    return (
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(`<svg height="${height}" width="${width}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <filter id="displace" color-interpolation-filters="sRGB">
        <feImage x="0" y="0" width="${width}" height="${height}" href="${map}" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${strength}" xChannelSelector="R" yChannelSelector="G" />
    </filter>
</svg>`) +
        '#displace'
    );
}

export function supportsBackdropFilterUrl() {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('backdrop-filter', "url('#test')");
}
