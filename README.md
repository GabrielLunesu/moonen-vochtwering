# Donato Lunesu - Warmtepomp & Airco Specialist Website

Een moderne, responsieve website voor Donato Lunesu, specialist in warmtepompen en airconditioning in Nederland.

## Functionaliteiten

- Moderne, responsieve one-page website
- Floating navigatiebalk met smooth scrolling
- Secties voor: Home, Over ons, Diensten, Werkgebied, Contact
- Contactformulier met validatie
- Volledig geoptimaliseerd voor mobiele apparaten
- Animaties en interactieve elementen
- SEO-geoptimaliseerd

## Technologieën

- [Next.js 15](https://nextjs.org/) - React framework
- [React 19](https://react.dev/) - JavaScript bibliotheek
- [Tailwind CSS 4](https://tailwindcss.com/) - CSS framework
- App Router - Next.js routing systeem
- Responsive design - Mobile-first aanpak

## Installatie

1. Clone de repository:
```bash
git clone https://github.com/yourusername/donato-lunesu.git
cd donato-lunesu
```

2. Installeer de dependencies:
```bash
npm install
```

3. Start de development server:
```bash
npm run dev
```

4. Configureer de email functionaliteit:
   - Maak een `.env.local` bestand aan in de root van het project
   - Voeg de volgende variabelen toe:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_APP_PASSWORD=your_app_password
   ```
   - Voor Gmail moet je een App Password gebruiken, niet je reguliere wachtwoord
   - Om een App Password te maken:
     1. Ga naar je Google Account instellingen
     2. Selecteer Beveiliging
     3. Onder "Inloggen bij Google," selecteer 2-stapsverificatie
     4. Onderaan de pagina, selecteer App-wachtwoorden
     5. Selecteer "Mail" als app en "Anders" als apparaat
     6. Voer een naam in (bijv. "Lunesu Website")
     7. Klik op "Genereren"
     8. Kopieer het gegenereerde wachtwoord en plak het als EMAIL_APP_PASSWORD

5. Open [http://localhost:3000](http://localhost:3000) in je browser.

## Productie build

Om een productie build te maken:

```bash
npm run build
```

Om de productie build lokaal te testen:

```bash
npm run start
```

## Projectstructuur

```
donato-lunesu/
├── public/             # Statische bestanden (afbeeldingen, iconen)
│   └── icons/          # SVG iconen voor diensten
├── src/                # Broncode
│   └── app/            # Next.js app router
│       ├── components/ # React componenten
│       ├── globals.css # Globale CSS
│       ├── layout.js   # Root layout
│       └── page.js     # Homepage
├── package.json        # Project dependencies
└── README.md           # Project documentatie
```

## Componenten

- `Navbar.js` - Floating navigatiebalk met mobiel menu
- `Hero.js` - Hero sectie met introductie
- `About.js` - Over ons sectie
- `Services.js` - Diensten sectie
- `Brands.js` - Merken sectie
- `WorkArea.js` - Werkgebied sectie
- `Contact.js` - Contact sectie met formulier
- `Footer.js` - Footer met links en contactgegevens
- `ScrollToTop.js` - Scroll naar boven knop

## Licentie

Dit project is eigendom van Donato Lunesu.

## Contact

Voor vragen of informatie, neem contact op via:
- Email: info@donatolunesu.nl
- Telefoon: +31 6 12345678
