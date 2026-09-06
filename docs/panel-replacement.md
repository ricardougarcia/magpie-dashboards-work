# Panel 1 / Panel 2 scroll replacement

Panel 0 remains in native flow. Panel 1 moves at 25% of document scroll speed once the Panel 2 top line enters the viewport. Panel 2 and Panels 3, 4, 5 form one opaque sheet in native flow. The Panel 2 top line covers Panel 1 as it rises. The Tri-shelf remains ordinary Panel 1 content.

`PANEL_REPLACEMENT_DEFAULTS` in `src/lib/panel-replacement.ts` exposes `outgoingSpeed` (0.25) and `opacityFloor` (0.15). Both can also be passed to `PanelReplacement`. No spring, duration, wheel interception, snap point, or scroll-direction state is used. One event-scheduled animation frame applies the current scroll position; no loop runs while scrolling is stopped. Layout is measured on resize, font readiness, and restored-page navigation.

For a tall Panel 1, native scrolling first reveals all its content. Replacement starts when the Panel 2 top line enters the viewport. Progress is the amount of overlap divided by the distance from that line to the top of Panel 1 content. Opacity reaches its floor at 85% overlap and stays there. Only when the line reaches the top of the content is Panel 1 marked replaced and made inert. The opaque Panel 2 sheet performs the actual occlusion; it never fades. Scrolling upward evaluates the same function in reverse.

Panel 0 / Panel 1 share a boundary, Panel 2 owns the shared sweeping boundary, and Panels 3, 4, 5 retain their boundaries. Boundary colors use the existing design tokens, not the red annotation from the references.

## Future pinned and morph-in-place tags

No application element is tagged yet. When requested, wrap an element within `PanelReplacement` with `PanelPersistentElement`:

```tsx
<PanelPersistentElement mode="pinned">
  <FutureElement />
</PanelPersistentElement>

<PanelPersistentElement
  mode="morph-in-place"
  replacement={<FuturePanel2Content />}
>
  <FuturePanel1Content />
</PanelPersistentElement>
```

A layout slot preserves the original dimensions. The live content renders into a separate portal layer above Panel 1 and Panel 2, so ancestor opacity or transforms cannot fade or drag it. The container stays at its viewport position during replacement and rejoins native flow once replacement completes. Its React state survives scrolling and reversal. Morph content crossfades by replacement progress within that same container; only the nearer state is interactive and exposed to assistive technology. The two example tags above are documentation only.

Reduced motion uses native scrolling and full opacity. Printing also restores the readable Panel 1. The existing timeline scrolling, focus states, telemetry overlays, and media preview remain outside the panel motion logic.

## Release

Target `uat` only. Production still requires Rico's explicit release request. Preserve the white UAT favicon and separate environment credentials.
