# 3DMantap product requirements

## Goal

A single-business Indonesian customization platform with Fashion and Interior studios, a 2D/3D room planner, product previews, and consultation-first production.

## Roles

Visitors design and submit with a secure access link. Customers additionally save cloud designs and see their inquiries. Admin manages templates, quotes, payments, production, and business settings.

## Feature registry

The documents indexed in docs/README.md are the source of detailed acceptance criteria. Required capabilities: home, accounts, catalog and 3D previews, templates, fashion studio, interior studio, artwork, room planner, library and sharing, pricing, submissions and WhatsApp, consultations and quotes, manual payments, tracking, CMS, production export, business settings, and PWA.

## Required business behavior

1. Persist submission and immutable design snapshot before displaying WhatsApp action.
2. Consultation occurs outside the application; admin records the outcome in CMS.
3. Customer approves the current final quote and design revision in the application.
4. Revisions reset approval and prevent stale payment/production actions.
5. Admin verifies transfer evidence. Production requires approval and the amount due before production.
6. Final production exports refer to the approved revision and contain physical-scale artwork or furniture cut lists.

## Defaults

Bahasa Indonesia; IDR integers; UI centimeters, stored millimeters. Original starter templates and prices are demonstrations requiring business validation. No AI or payment gateway in this release. Fashion shape follows template; furniture uses supported parametric structures.

## Visual and model requirements

The storefront uses large product imagery, restrained typography, a neutral palette and responsive layouts. Bundled garment/accessory meshes are sourced GLBs with recorded licenses, integrity hashes and reproducible processing. Furniture uses sourced GLB board/door components sized from the same physical panel generator as cut lists. Artwork projects onto actual product surfaces. Room 3D uses camera-dependent exterior wall cutaway. Default models/fonts/preview images remain available offline; private API assets are excluded. Source provenance and manufacturing limitations are documented in docs/model-assets.md.

Doors attach to wall openings, align with wall direction and remain attached while dragged in 2D or 3D. Furniture and a clothed human are draggable in both modes. The optional human defaults to 170 cm and provides physical height comparison. Built-in shirts, hoodies, jackets and pants offer a worn preview with custom colors/artwork on that same human. The preview is illustrative and does not certify garment fit. Sneaker detail and catalog previews preserve source proportions.
