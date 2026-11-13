This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Notifications push

Les notifications push Web utilisent Firebase Cloud Messaging. Ajoutez `NEXT_PUBLIC_FIREBASE_VAPID_KEY` aux variables publiques Firebase existantes. Les variables serveur `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` et `FIREBASE_PRIVATE_KEY` restent nécessaires pour Firebase Admin et ne doivent jamais être préfixées par `NEXT_PUBLIC_`.

Dans Firebase Console, activez Cloud Messaging et générez une paire de clés Web Push dans **Project settings > Cloud Messaging > Web configuration**. Placez uniquement la clé publique VAPID dans `NEXT_PUBLIC_FIREBASE_VAPID_KEY`, puis redémarrez Next.js. L’administration `/administrateur` permet ensuite un envoi manuel vers la collection serveur `push_subscribers`.

Les tests doivent être réalisés en HTTPS (ou sur `localhost`) après activation des notifications dans Chrome, Firefox, Edge ou Safari compatible. Phoenix est testé par les API réellement disponibles : le bouton reste inactif avec un message explicite si Notification API, Push API, Service Worker ou Firebase Messaging ne sont pas supportés.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
