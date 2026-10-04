# Ashok Castle Resident Portal

A React dashboard for the six Ashok Castle apartments: G1, F1, F2, F3, S1,
and S2. Administrators can edit apartment numbers, addresses, resident type,
owner and tenant contact numbers, apartment photos, and monthly common
electricity, motor, security, and housekeeping expenses. Guest accounts can
view the dashboard and apartment details without editing them.
Each expense category has its own optional date. The Expenses page shows the
dates with the apartment-by-apartment amounts and a bar chart comparing the
community totals for each category.

## Appearance

Use the Light mode / Dark mode button on the sign-in page or dashboard to
switch themes. Your choice is saved in this browser and applied on your next
visit.

## Demo sign-in

- **Administrator:** `adminuser` / `admin123`
- **Guest:** `guest` / `guest123`

These are demonstration credentials checked in the browser, not production
authentication. Do not deploy the demo login as a security boundary. Configure
a secure authentication provider and authorization service before using this
app with real resident or contact information.

## Saved data and photos

Apartment details and uploaded photos are saved in the current browser's local
storage; no server or account-based synchronization is configured. Uploaded
photos are resized to a maximum 1200-pixel dimension and stored as JPEG to
reduce browser storage use. Local browser data is not automatically shared with
other browsers or devices.

## Run locally

In this project folder, run:

```sh
npm install
npm start
```

Run the tests with `npm test -- --watchAll=false --runInBand`, or create a
production build with `npm run build`.
