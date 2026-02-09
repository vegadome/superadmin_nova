Pour un dashboard admin professionnel en 2026, la structure doit être pensée pour la **scalabilité**, la **sécurité** et la **vitesse d'exécution**. On ne veut pas juste un "site", on veut un outil de contrôle.

Voici la structure recommandée pour ton projet **Next.js 15+ (App Router)** avec **Tailwind CSS**, **Zustand** et **TanStack Query**.

---

## 1. Structure du Projet (Professional Architecture)

```text
/src
  /app
    /(auth)           # Routes de login (layout dédié)
    /(dashboard)      # Routes protégées (layout avec Sidebar)
      /users          # Gestion des infirmiers & clients
      /missions       # Modération des annonces
      /verification   # LE HUB de validation (notre priorité)
      /finance        # Stripe Connect, payouts, commissions
    /api              # Webhooks (Stripe, Supabase)
  /components
    /ui               # Composants atomiques (Button, Input, Badge)
    /shared           # Sidebar, Navbar, UserAvatar
    /features         # Logique complexe (ex: VerificationModal, StatsChart)
  /hooks              # Custom hooks (useAuth, useDebounce)
  /lib                # Config (supabase-admin, stripe, utils)
  /services           # Appels API (user.service.ts, mission.service.ts)
  /store              # Zustand stores (useAdminStore.ts)
  /types              # Interfaces TypeScript & Database types

```

---

## 2. Features Essentielles (Back-Office Infirmier)

Au vu de ton application actuelle, voici ce dont tu as strictement besoin pour piloter le business :

### A. Le Hub de Vérification (Critique)

* **Vue "Pending"** : Liste des infirmiers ayant soumis leurs documents.
* **Visionneuse de Documents** : Preview des diplômes/cartes INAMI sans téléchargement forcé.
* **Workflow d'approbation** :
* Bouton **"Approuver"** (passe `verification_status` à `verified`).
* Bouton **"Rejeter"** avec ouverture d'une modale pour saisir le motif (sauvegardé dans `verification_feedback`).


* **Historique** : Journal des actions (qui a validé qui et quand).

### B. Gestion des Missions & Flux

* **Modération** : Possibilité de modifier ou supprimer une mission suspecte.
* **Matching Tracker** : Voir combien d'infirmiers ont postulé à une mission en temps réel.
* **Emergency Toggle** : Forcer une mission en "Urgent" pour booster sa visibilité.

### C. Finance & Monitoring

* **Dashboard Revenus** : Total du volume d'affaires (GMV) vs Commissions plateforme.
* **Stripe Connect Status** : Voir si l'infirmier a fini son onboarding Stripe (pour éviter les blocages de paiement).
* **Logs d'erreurs** : Suivi des paiements échoués.

---

## 3. Stack Technique Recommandée

| Outil | Utilisation | Pourquoi ? |
| --- | --- | --- |
| **TanStack Query (v5)** | Fetching & Caching | Gère le refresh automatique des listes de missions/users. |
| **Zustand** | Global State | Pour l'état de la Sidebar et les filtres persistants de l'admin. |
| **Shadcn/UI** | Bibliothèque de composants | Le standard pro actuel (basé sur Radix UI et Tailwind). |
| **Lucide React** | Iconographie | Cohérence totale avec ton app mobile. |
| **Recharts** | Data Viz | Pour les courbes de croissance et de revenus. |

---

## 4. Configuration du Store Zustand (`useAdminStore.ts`)

Pour ton admin, Zustand va servir à gérer la sélection globale et les filtres de recherche sans recharger la page.

```typescript
import { create } from 'zustand';

interface AdminState {
  pendingVerificationsCount: number;
  setPendingCount: (count: number) => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  pendingVerificationsCount: 0,
  setPendingCount: (count) => set({ pendingVerificationsCount: count }),
  selectedUserId: null,
  setSelectedUserId: (id) => set({ selectedUserId: id }),
}));

```

---

## 5. Prochaine étape : La logique de validation

La pièce maîtresse est le service qui va mettre à jour Supabase. On va utiliser le client **Supabase Admin** (Service Role) dans l'admin Next.js pour bypasser les RLS (Row Level Security) et forcer la validation.

**Souhaites-tu que je commence par te coder la page "Vérification" avec la liste des infirmiers en attente et la modale de décision ?**