Voici mon plan d'attaque pour la section Finance de ton SuperAdmin :
1. La Stratégie Stripe (Logique de Flux)

    Encaissement : Le Facility paie le montant total de la mission.

    Calcul de la commission : Le système vérifie le commission_rate spécifique à ce facility_id dans ta table facilities.

    Dispatch : Stripe envoie automatiquement (ou après validation) la part de l'infirmier sur son compte Connect et garde ta commission sur ton compte Stripe principal.

2. Les Features Admin à ajouter
A. Le "Rate Manager" (Gestion des Commissions)

C'est ce que tu as demandé. Dans la fiche de chaque établissement, on ajoute un curseur ou un champ numérique pour définir leur commission personnalisée.

    Fonctionnement : Une colonne commission_rate existe déjà dans ta table facilities. On va créer une interface pour la modifier. Si un facility a 0.12, la plateforme prendra 12% sur ses missions au lieu des 10% standards.

B. Monitoring du Onboarding Stripe

Un infirmier ne peut pas être payé si son compte Stripe Connect n'est pas "active".

    Feature : Un badge de statut Stripe (Complet / Incomplet) dans ta liste d'utilisateurs. Si c'est incomplet, on affiche un bouton pour lui renvoyer un lien de configuration.

C. Historique des Revenus (Earnings)

Un tableau de bord financier qui affiche :

    Volume Total (GMV) : L'argent total ayant transité.

    Revenu Net (Net Revenue) : La somme de toutes tes commissions perçues.

    Paiements en attente : Ce qui doit encore être transféré aux infirmiers après la fin de leurs missions.

D. Gestion des Litiges & Remboursements

Si une mission se passe mal, l'admin doit pouvoir déclencher un remboursement partiel ou total au Facility depuis le SuperAdmin sans aller sur le dashboard Stripe.