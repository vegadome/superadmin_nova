C'est une excellente initiative. Pour un projet qui touche à la santé (infirmiers, données INAMI), la **vérification d'identité (KYC - Know Your Customer)** est cruciale pour votre crédibilité et la sécurité des patients.

Voici l'analyse des solutions pour mettre en place ce système de "Liveness Check" et de vérification biométrique.

---

### 1. Stripe Identity

C’est la solution la plus naturelle puisque vous utilisez déjà Stripe pour les paiements et Connect. Elle gère tout : capture du document, selfie dynamique (liveness) et validation automatique.

* **Pour :**
* **Expérience utilisateur :** Interface mobile parfaite, fluide et rassurante.
* **Sécurité maximale :** Détection de fraude ultra-performante (détecte si c'est une photo d'une photo).
* **Écosystème :** Tout est centralisé dans votre dashboard Stripe. Vous pouvez lier la validation d'identité au déblocage des virements (Payouts).


* **Contre :**
* **Coût :** Environ **1,50 € à 2,00 € par vérification** (cela peut vite chiffrer).
* **Rigidité :** Si le document est belge mais un peu usé, le système peut être capricieux.



---

### 2. Solutions Alternatives (Veriff, Sumsub, Onfido)

Ce sont des leaders mondiaux spécialisés uniquement dans l'identité.

* **Pour :**
* Souvent plus flexibles sur les types de documents acceptés.
* Possibilité de vérification manuelle par leurs agents en cas d'échec de l'IA.


* **Contre :**
* Nécessite d'intégrer un nouveau SDK (en plus de Supabase et Stripe).
* Gestion de la facturation séparée.



---

### 3. Solution "Maison" (Supabase Storage + IA type Amazon Rekognition)

Vous demandez à l'utilisateur d'uploader une photo et un selfie, puis vous comparez les deux via une API d'analyse d'image.

* **Pour :**
* Coût très faible (quelques centimes par analyse).


* **Contre :**
* **Pas de "Liveness Check" réel** : Un utilisateur peut uploader la photo de quelqu'un d'autre sans être présent physiquement.
* **Responsabilité légale** : Vous stockez vous-même des documents d'identité ultra-sensibles (RGPD très lourd).



---

### Le comparatif en un coup d'œil

| Critère | Stripe Identity | Veriff / Sumsub | Solution "Maison" |
| --- | --- | --- | --- |
| **Fiabilité** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Vitesse d'intégration** | Ultra Rapide | Moyenne | Lente |
| **Coût** | Élevé | Moyen | Très Faible |
| **Conformité RGPD** | Géré par Stripe | Géré par le tiers | **À votre charge (Risqué)** |

---

### Ma recommandation : Stripe Identity

Pour une plateforme professionnelle comme **InfiMatch**, je vous recommande vivement **Stripe Identity**.

**Pourquoi ?**

1. **Confiance :** Un infirmier sera beaucoup plus serein de donner son passeport via une interface Stripe que via un formulaire "custom".
2. **Scalabilité :** Vous n'avez pas envie de passer vos journées à vérifier manuellement si le selfie ressemble à la carte d'identité. Stripe vous renvoie un simple statut `verified` ou `requires_input`.
3. **Lien avec les paiements :** Vous pouvez configurer Stripe pour qu'un infirmier ne puisse pas recevoir son argent tant que son identité n'est pas vérifiée à 100%.

> **Note stratégique :** Comme le coût est non-négligeable, vous pouvez décider de ne déclencher cette vérification **qu'une seule fois**, juste après que vous (l'admin) ayez validé la carte INAMI. Cela évite de payer pour des utilisateurs fantômes.

# ________________________ TODO ______________________

C'est tout à fait possible pour un **MVP**, et c'est même ce que font beaucoup de startups au début pour valider leur concept avant d'investir dans des solutions à 2 € la vérification.

Cependant, sur le plan **RGPD**, vous touchez à des données "hautement sensibles" (biométrie et identité d'État). Voici l'analyse des risques et la marche à suivre pour rester dans les clous.

---

### 1. Le cadre RGPD : Ce qu'il faut savoir

En Belgique (via l'APD - Autorité de Protection des Données), stocker une copie de carte d'identité est très encadré.

* **Le principe de Minimisation :** Vous ne devez demander ces photos que si c'est strictement nécessaire à la sécurité de la plateforme (ce qui est le cas pour InfiMatch).
* **La conservation limitée :** Vous ne pouvez pas garder ces photos "à vie". Une fois l'infirmier vérifié, vous devriez idéalement supprimer les photos brutes et ne garder qu'un marqueur `identity_verified: true`.
* **Le consentement :** L'utilisateur doit cocher une case spécifique : *"J'accepte que mes documents d'identité soient traités pour la vérification de mon compte."*

---

### 2. Les "Pour" et "Contre" de la méthode manuelle

| Pour | Contre |
| --- | --- |
| **Coût Zéro** (uniquement le stockage Supabase). | **Temps Admin** : Vous devrez zoomer sur chaque photo manuellement. |
| **Contrôle Total** : Vous décidez si une photo un peu floue passe ou non. | **Risque de Sécurité** : Si votre bucket Supabase est mal configuré, les cartes d'identité sont exposées. |
| **Simplicité technique** : Pas d'API externe à configurer. | **Fraude** : Difficile de détecter un bon montage Photoshop à l'œil nu. |

---

### 3. Ma recommandation pour votre MVP "Pro"

Si vous choisissez la méthode manuelle, vous devez la rendre **sécurisée** pour être conforme au RGPD. Voici comment faire :

1. **Bucket Privé Obligatoire :** Les photos d'identité ne doivent **jamais** être dans un dossier public. Elles doivent être dans un bucket où seule votre Policy SQL `admin` peut lire.
2. **Filigrane (Watermark) :** Idéalement, demandez aux infirmiers d'ajouter un petit papier à côté du selfie avec écrit "InfiMatch + Date" pour éviter qu'ils n'utilisent une vieille photo trouvée sur le web.
3. **Audit Trail :** Vous devez pouvoir prouver qui a validé quel document et quand.

---

### 4. Le compromis idéal : "L'approche Hybride"

Pour votre MVP, je vous suggère ceci :

* **Phase 1 (Maintenant) :** Vous demandez la photo ID + Selfie sur votre interface actuelle. Vous stockez cela dans un dossier privé de votre bucket `inami-cards`.
* **Phase 2 (Scalabilité) :** Dès que vous avez vos 20 ou 50 premiers infirmiers, vous branchez **Stripe Identity** pour automatiser la corvée.

### Est-ce légal ?

**Oui**, tant que :

1. Vous informez l'utilisateur (CGU/Politique de confidentialité).
2. Vous sécurisez l'accès (RLS que nous avons mis en place).
3. Vous ne téléchargez pas ces photos sur votre propre ordinateur personnel (restez dans le cloud sécurisé).



