const fs = require("fs");
const path = require("path");

const modules = [
  "fournisseurs",
  "inventaire",
  "operations-stock",
  "reception",
  "alertes-stock",
  "stock-avance",
  "paiements-vente",
  "credits-clients",
  "encaisser-credit",
  "depenses",
  "entrees-sorties-caisse",
  "cloture-journaliere",
  "taux-change",
  "annulations",
  "details-vente",
  "ventes-manager",
  "statistiques-avancees",
  "immobilier",
  "clients-immobilier",
  "biens-immobiliers",
  "contrats-bail",
  "paiements-loyers",
  "charges-immobilier",
  "documents-immobilier",
  "rapports-immobilier",
  "salle",
  "clients-salle",
  "reservation-salle",
  "calendrier-salle",
  "paiements-salle",
  "contrats-salle",
  "location-materiels",
  "tarification-salle",
  "marketing",
  "partenaires",
  "remises-promotions",
  "parametres-fidelite",
  "fidelite-retrait",
  "utilisateurs",
  "permissions",
  "connexions-utilisateurs",
  "signature-manager",
  "presence-absence",

  "audit-log",
  "backup-restore",
  "catalogue-fournisseur",
  "comptables",
  "configuration-systeme",
  "locataires",
  "bon-commande",
  "facture-fournisseur",
  "paiements-fournisseur",
  "validation-depenses",
  "academique",
  "etudiants",
  "enseignants",
  "classes",
  "cours",
  "notes",
  "bulletins",

  "base",
  "comptabilite-location",
  "coupons",
  "credit-manager",
  "dashboard-academique",
  "gestion-imprimantes",
  "historique-achats",
  "likelemba-wizard",
  "maintenance-immobilier",
  "mandat-gestion",
  "recherche-acheteurs",
  "salaires-agents",
  "sql-admin-credentials",
  "test",
  "activation",
  "a-propos",
  "config-poste-pos",
  "configuration-presence",
  "dashboard-boss",
  "details-boutique",
  "details-boutique-paiements",
  "entrees",
  "facebook-rapide",
  "inscription",
  "inventaire-scanner",
  "marketing-private-settings",
  "objectifs-campagnes",
  "performance-agents",
  "primes-commissions",
  "select-produit-equivalent",
  "session-caisse",

  "affectations-cours",
  "annee-academique",
  "configuration-paiements-academiques",
  "documents-etudiants",
  "filieres",
  "horaires-cours",
  "inscriptions",
  "niveaux",
  "paie-enseignants",
  "paiements-etudiants",
  "presences",
  "rapports-academiques",
  "clients-rapide",
"dashboard-immobilier",
"gestion-fournisseurs-achats",
"loyalty-mouvements",
"marketing-immobilier",
"promo-partenaire-manager",
"unites-immobilieres",

"alertes-stock-expiration",
"choisir-equivalent-vente",
"manager-mouvements-caisse",
"ordonnance-vente",

"comptabilite-salle",
"rapports-salle",
"gestion-salle-main",
"historique-reservations-salle",
"parametres-salles",

"utilisateurs-immobilier",

"caisse",
"produits",
"clients",
"ventes",
"employes",

"details",
"login",
"main",
"form1"
];

const ROOT = process.cwd();
const backendRoot = path.join(ROOT, "..", "backend", "src");
const frontendRoot = path.join(ROOT, "app", "dashboard");

function pascalCase(str) {
  return str
    .split("-")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join("");
}

for (const mod of modules) {
  const moduleClass = pascalCase(mod);

  const backendDir = path.join(backendRoot, mod);
  const dtoDir = path.join(backendDir, "dto");

  fs.mkdirSync(dtoDir, { recursive: true });

  fs.writeFileSync(
    path.join(backendDir, `${mod}.module.ts`),
`import { Module } from '@nestjs/common';
import { ${moduleClass}Controller } from './${mod}.controller';
import { ${moduleClass}Service } from './${mod}.service';

@Module({
  controllers: [${moduleClass}Controller],
  providers: [${moduleClass}Service],
})
export class ${moduleClass}Module {}
`
  );

  fs.writeFileSync(
    path.join(backendDir, `${mod}.controller.ts`),
`import { Controller, Get } from '@nestjs/common';
import { ${moduleClass}Service } from './${mod}.service';

@Controller('${mod}')
export class ${moduleClass}Controller {
  constructor(private readonly service: ${moduleClass}Service) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
`
  );

  fs.writeFileSync(
    path.join(backendDir, `${mod}.service.ts`),
`import { Injectable } from '@nestjs/common';

@Injectable()
export class ${moduleClass}Service {
  findAll() {
    return {
      module: '${mod}',
      message: 'Backend ${mod} actif'
    };
  }
}
`
  );

  fs.writeFileSync(
    path.join(dtoDir, `create-${mod}.dto.ts`),
`export class Create${moduleClass}Dto {}
`
  );

  const frontendDir = path.join(frontendRoot, mod);
  fs.mkdirSync(frontendDir, { recursive: true });

  fs.writeFileSync(
    path.join(frontendDir, "page.tsx"),
`export default function Page() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-3xl font-bold text-slate-900">${moduleClass}</h1>
        <p className="mt-3 text-slate-500">Module connecté au backend.</p>
      </div>
    </main>
  );
}
`
  );

  console.log("✅ MODULE :", mod);
}

console.log("\\n🚀 Tous les modules ont été générés.");