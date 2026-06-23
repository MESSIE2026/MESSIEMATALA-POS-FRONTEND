'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import {
  Printer,
  FileText,
  Ticket,
  ArrowLeft,
} from 'lucide-react';
import {
  getParametresDocuments,
  documentImageUrl,
  nomEntrepriseDocument,
  couleurPrincipaleDocument,
  type ParametresDocuments,
} from '../../../services/documents.service';

const API = 'https://messiematala-pos-backend-production.up.railway.app';

export default function VoirVentePage() {
  const router = useRouter();

  const [id, setId] = useState<string | null>(null);
  const [vente, setVente] = useState<any>(null);
  const [paramsDocs, setParamsDocs] =
  useState<ParametresDocuments | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get('id'));
  }, []);

  useEffect(() => {
    if (!id) return;
    chargerVente();
  }, [id]);

  useEffect(() => {
  chargerParametresDocuments();
}, []);

async function chargerParametresDocuments() {
  try {
    const data = await getParametresDocuments();
    setParamsDocs(data);
  } catch (e) {
    console.error(e);
  }
}

  function extraireLignes(data: any): any[] {
  const sources = [
    data?.details,
    data?.detailsvente,
    data?.detailvente,
    data?.detailsVente,
    data?.lignes,
    data?.articles,
    data?.produits,
    data?.items,
    data?.vente?.details,
    data?.vente?.detailsvente,
    data?.data?.details,
    data?.data?.detailsvente,
  ];

  for (const s of sources) {
    if (Array.isArray(s)) return s;
  }

  return [];
}

function extrairePaiements(data: any): any[] {
  const sources = [
    data?.paiements,
    data?.paiement,
    data?.payments,
    data?.vente?.paiements,
    data?.data?.paiements,
  ];

  for (const s of sources) {
    if (Array.isArray(s)) return s;
  }

  return [];
}

  async function chargerVente() {
  if (!id || isNaN(Number(id))) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);

    const res = await fetch(`${API}/ventes/${id}`, {
      cache: 'no-store',
    });

    const texte = await res.text();

    if (!res.ok) {
      throw new Error(`Erreur API ${res.status} : ${texte}`);
    }

    const data = texte ? JSON.parse(texte) : null;

    const details = extraireLignes(data);
    const paiements = extrairePaiements(data);

    setVente({
      ...data,
      details,
      detailsvente: details,
      paiements,
    });
  } catch (error) {
    console.error(error);
    alert(String(error));
  } finally {
    setLoading(false);
  }
}
  function normaliserDevise(devise: any): string {
    const d = String(devise ?? 'USD').trim().toUpperCase();

    if (d === 'FC' || d === 'CDF' || d === 'FRANC' || d === 'FRANCS') return 'CDF';
    if (d === '$' || d === 'DOLLAR' || d === 'DOLLARS') return 'USD';
    if (d === 'EURO' || d === 'EUROS') return 'EUR';

    return d || 'USD';
  }

  function nombreDepuisTexte(valeur: any): number {
    let texte = String(valeur ?? '0')
      .replace(/\$/g, '')
      .replace(/USD/gi, '')
      .replace(/CDF/gi, '')
      .replace(/FC/gi, '')
      .replace(/\u202f/g, '')
      .replace(/\u00a0/g, '')
      .replace(/\s/g, '')
      .replace(/\//g, '')
      .trim();

    if (texte.includes(',') && texte.includes('.')) {
      texte = texte.replace(/\./g, '').replace(',', '.');
    } else if (texte.includes(',') && !texte.includes('.')) {
      texte = texte.replace(',', '.');
    }

    const n = Number(texte);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMontant(montant: any, devise?: string): string {
    const n = nombreDepuisTexte(montant);
    const d = normaliserDevise(devise);
    const decimals = d === 'CDF' ? 0 : 2;

    return n
      .toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
      .replace(/\u202f/g, ' ')
      .replace(/\u00a0/g, ' ');
  }

  function formatMontantPdf(montant: any, devise?: string): string {
    const n = nombreDepuisTexte(montant);
    const d = normaliserDevise(devise);
    const decimals = d === 'CDF' ? 0 : 2;

    const fixed = n.toFixed(decimals);
    const [entier, decimal] = fixed.split('.');
    const entierFormatte = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    return decimal ? `${entierFormatte},${decimal}` : entierFormatte;
  }

  function montantLigne(d: any): number {
    return (
      nombreDepuisTexte(d.montant) ||
      nombreDepuisTexte(d.total) ||
      nombreDepuisTexte(d.prixunitaire) * nombreDepuisTexte(d.quantite)
    );
  }

  function genererCodeBarreBase64(code: string) {
    const canvas = document.createElement('canvas');

    JsBarcode(canvas, code || 'MESSIE-POS', {
      format: 'CODE128',
      width: 2,
      height: 55,
      displayValue: true,
      fontSize: 14,
      margin: 5,
    });

    return canvas.toDataURL('image/png');
  }

  const infos = useMemo(() => {
    if (!vente) return null;

    const lignes =
      Array.isArray(vente?.details) && vente.details.length > 0
        ? vente.details
        : Array.isArray(vente?.detailsvente)
          ? vente.detailsvente
          : [];

    const paiements = Array.isArray(vente?.paiements) ? vente.paiements : [];

    const codeFacture =
      vente.codefacture ||
      vente.codeFacture ||
      vente.reference ||
      vente.numerofacture ||
      vente.numero_facture ||
      `VENTE-${vente.id_vente || id}`;

    const nomClient =
      vente.nomclient ||
      vente.nom_client ||
      vente.client ||
      vente.nom ||
      'CLIENT CASH';

    const telephoneClient =
      vente.telephone ||
      vente.tel ||
      vente.telephoneclient ||
      vente.telephone_client ||
      '-';

    const nomCaissier =
      vente.nomcaissier ||
      vente.nom_caissier ||
      vente.caissier ||
      vente.employe ||
      vente.nomemploye ||
      vente.nom_employe ||
      'CAISSIER WEB';

    const modePaiement =
      vente.modepaiement ||
      vente.mode_paiement ||
      paiements?.[0]?.modepaiement ||
      '-';

    const totalLignesUSD = lignes
  .filter((x: any) => normaliserDevise(x.devise) === 'USD')
  .reduce((s: number, d: any) => s + montantLigne(d), 0);

const totalLignesCDF = lignes
  .filter((x: any) => normaliserDevise(x.devise) === 'CDF')
  .reduce((s: number, d: any) => s + montantLigne(d), 0);

const totalLignesEUR = lignes
  .filter((x: any) => normaliserDevise(x.devise) === 'EUR')
  .reduce((s: number, d: any) => s + montantLigne(d), 0);

const deviseVente = normaliserDevise(vente.devise);

const montantGlobal =
  nombreDepuisTexte(vente.montanttotal) ||
  nombreDepuisTexte(vente.montant_total) ||
  nombreDepuisTexte(vente.total) ||
  nombreDepuisTexte(vente.totalvente) ||
  nombreDepuisTexte(vente.total_vente);

const totalUSD =
  totalLignesUSD ||
  nombreDepuisTexte(vente.totalUSD) ||
  nombreDepuisTexte(vente.total_usd) ||
  nombreDepuisTexte(vente.montantusd) ||
  (deviseVente === 'USD' ? montantGlobal : 0);

const totalCDF =
  totalLignesCDF ||
  nombreDepuisTexte(vente.totalCDF) ||
  nombreDepuisTexte(vente.total_cdf) ||
  nombreDepuisTexte(vente.montantcdf) ||
  nombreDepuisTexte(vente.montant_cdf) ||
  nombreDepuisTexte(vente.montantfc) ||
  nombreDepuisTexte(vente.montant_fc) ||
  (deviseVente === 'CDF' ? montantGlobal : 0);

const totalEUR =
  totalLignesEUR ||
  nombreDepuisTexte(vente.totalEUR) ||
  nombreDepuisTexte(vente.total_eur) ||
  nombreDepuisTexte(vente.montanteur) ||
  (deviseVente === 'EUR' ? montantGlobal : 0);

    const remiseUSD = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'USD')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.remise), 0);

    const remiseCDF = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'CDF')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.remise), 0);

    const remiseEUR = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'EUR')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.remise), 0);

    const tvaUSD = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'USD')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.tva), 0);

    const tvaCDF = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'CDF')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.tva), 0);

    const tvaEUR = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'EUR')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.tva), 0);

    return {
      lignes,
      paiements,
      codeFacture,
      nomClient,
      telephoneClient,
      nomCaissier,
      modePaiement,
      totalUSD,
      totalCDF,
      totalEUR,
      remiseUSD,
      remiseCDF,
      remiseEUR,
      tvaUSD,
      tvaCDF,
      tvaEUR,
      statut: vente.statut || 'VALIDEE',
      dateVente: vente.datevente || vente.createdat || null,
    };
  }, [vente, id]);

  function construireHtmlA4() {
  if (!infos) return '';

  const dateVente = infos.dateVente ? new Date(infos.dateVente) : new Date();
  const dateOnly = dateVente.toLocaleDateString('fr-FR');
  const heureOnly = dateVente.toLocaleTimeString('fr-FR');
  const ticketNo = String(vente?.id_vente || id || Date.now()).padStart(6, '0');

  const logoUrl = documentImageUrl(paramsDocs?.logo_url);
  const filigraneUrl = documentImageUrl(paramsDocs?.filigrane_url);
  const cachetUrl = documentImageUrl(paramsDocs?.cachet_url);
  const signatureUrl = documentImageUrl(paramsDocs?.signature_direction_url);

  const couleurPrincipale =
    paramsDocs?.couleur_principale || '#111827';

  const barcodeUrl = genererCodeBarreBase64(infos.codeFacture);

  const lignesHtml =
    infos.lignes.length > 0
      ? infos.lignes
          .map((d: any) => {
            const devise = normaliserDevise(d.devise);
            const qte = Math.max(nombreDepuisTexte(d.quantite), 1);
            const pu =
              nombreDepuisTexte(d.prixunitaire) || montantLigne(d) / qte;

            return `
              <tr>
                <td>${d.refproduit || '-'}</td>
                <td>${d.nomproduit || d.designation || '-'}</td>
                <td class="center">${qte}</td>
                <td class="right">${formatMontant(pu, devise)} ${devise}</td>
                <td class="right">${formatMontant(d.remise, devise)} ${devise}</td>
                <td class="center bold">${devise}</td>
                <td class="right bold">${formatMontant(montantLigne(d), devise)} ${devise}</td>
              </tr>
            `;
          })
          .join('')
      : `<tr><td colspan="7" class="center">Détails non chargés</td></tr>`;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Facture A4 ${infos.codeFacture}</title>

        <style>
          @page { size: A4 portrait; margin: 12mm; }

          * { box-sizing: border-box; }

          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            font-size: 12px;
            margin: 0;
            background: #fff;
          }

          .page {
            position: relative;
            width: 100%;
            min-height: 270mm;
            overflow: hidden;
          }

          .content {
            position: relative;
            z-index: 2;
          }

          .filigrane {
            position: absolute;
            left: 50%;
            top: 50%;
            width: 360px;
            max-height: 360px;
            object-fit: contain;
            opacity: 0.07;
            transform: translate(-50%, -50%);
            z-index: 1;
          }

          .top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 20px;
          }

          .logo {
            width: 105px;
            height: 105px;
            object-fit: contain;
          }

          h1 {
            margin: 0 0 8px 0;
            font-size: 24px;
            letter-spacing: .3px;
            color: ${couleurPrincipale};
          }

          .company-line {
            line-height: 1.55;
          }

          .line {
            border-top: 1.4px solid ${couleurPrincipale};
            margin: 18px 0;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 60px;
            font-weight: bold;
          }

          .box {
            border: 1px solid #999;
            padding: 7px 9px;
            border-radius: 2px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th {
            background: ${couleurPrincipale};
            color: white;
            padding: 8px;
            border: 1px solid #777;
            font-size: 11px;
          }

          td {
            padding: 7px;
            border: 1px solid #aaa;
            vertical-align: middle;
          }

          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }

          .totaux {
            width: 58%;
            margin-left: auto;
            margin-top: 15px;
          }

          .totaux td {
            padding: 8px;
          }

          .paiement {
            margin-top: 12px;
            border: 1px solid #999;
            padding: 8px;
            font-weight: bold;
          }

          .signature-zone {
            margin-top: 35px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 30px;
          }

          .cachet-img {
            height: 95px;
            max-width: 180px;
            object-fit: contain;
          }

          .signature-img {
            height: 75px;
            max-width: 180px;
            object-fit: contain;
          }

          .footer {
            text-align: center;
            margin-top: 22px;
            font-size: 12px;
            line-height: 1.55;
          }

          .barcode-box {
            text-align: center;
            margin-top: 18px;
            page-break-inside: avoid;
          }

          .barcode {
            width: 86mm;
            height: 22mm;
            object-fit: contain;
          }

          .small {
            font-size: 10px;
          }
        </style>
      </head>

      <body>
        <div class="page">
          ${
            paramsDocs?.afficher_filigrane && filigraneUrl
              ? `<img src="${filigraneUrl}" class="filigrane" />`
              : ''
          }

          <div class="content">
            <div class="top">
              <div class="company-line">
                <h1>${nomEntrepriseDocument(paramsDocs)}</h1>

                ${
                  paramsDocs?.slogan
                    ? `<div><b>${paramsDocs.slogan}</b></div>`
                    : ''
                }

                ${
                  paramsDocs?.adresse
                    ? `<div>${paramsDocs.adresse}</div>`
                    : ''
                }

                ${
                  paramsDocs?.ville || paramsDocs?.pays
                    ? `<div>${paramsDocs?.ville || ''} ${paramsDocs?.pays || ''}</div>`
                    : ''
                }

                ${
                  paramsDocs?.telephone
                    ? `<div>Tél : ${paramsDocs.telephone}</div>`
                    : ''
                }

                ${
                  paramsDocs?.telephone2
                    ? `<div>Tél 2 : ${paramsDocs.telephone2}</div>`
                    : ''
                }

                ${
                  paramsDocs?.email
                    ? `<div>Email : ${paramsDocs.email}</div>`
                    : ''
                }

                ${
                  paramsDocs?.site_web
                    ? `<div>Site : ${paramsDocs.site_web}</div>`
                    : ''
                }

                <div>RCCM : ${paramsDocs?.rccm || '-'}</div>
                <div>ID NAT : ${paramsDocs?.id_nat || '-'}</div>

                ${
                  paramsDocs?.numero_impot
                    ? `<div>N° Impôt : ${paramsDocs.numero_impot}</div>`
                    : ''
                }

                ${
                  paramsDocs?.numero_tva
                    ? `<div>N° TVA : ${paramsDocs.numero_tva}</div>`
                    : ''
                }
              </div>

              ${
                paramsDocs?.afficher_logo !== false && logoUrl
                  ? `<img class="logo" src="${logoUrl}" />`
                  : ''
              }
            </div>

            <div class="line"></div>

            <div class="grid">
              <div class="box">Ticket N° : ${ticketNo}</div>
              <div class="box">FACTURE N° : ${infos.codeFacture}</div>
              <div class="box">Date : ${dateOnly}</div>
              <div class="box">Caissier : ${infos.nomCaissier}</div>
              <div class="box">Heure : ${heureOnly}</div>
              <div class="box">Client : ${infos.nomClient}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Article</th>
                  <th>Qté</th>
                  <th>PU</th>
                  <th>Remise</th>
                  <th>Devise</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                ${lignesHtml}
              </tbody>
            </table>

            <table class="totaux">
              <tbody>
                ${
                  infos.totalUSD > 0
                    ? `<tr><td class="bold">TOTAL USD</td><td class="right bold">${formatMontant(infos.totalUSD, 'USD')} USD</td></tr>`
                    : ''
                }

                ${
                  infos.totalCDF > 0
                    ? `<tr><td class="bold">TOTAL CDF</td><td class="right bold">${formatMontant(infos.totalCDF, 'CDF')} CDF</td></tr>`
                    : ''
                }

                ${
                  infos.totalEUR > 0
                    ? `<tr><td class="bold">TOTAL EUR</td><td class="right bold">${formatMontant(infos.totalEUR, 'EUR')} EUR</td></tr>`
                    : ''
                }
              </tbody>
            </table>

            <div class="paiement">
              Mode : ${infos.modePaiement} | Totaux séparés par devise
            </div>

            <div class="signature-zone">
              <div>
                ${
                  cachetUrl
                    ? `<img src="${cachetUrl}" class="cachet-img" />`
                    : ''
                }
              </div>

              <div class="center">
                ${
                  signatureUrl
                    ? `<img src="${signatureUrl}" class="signature-img" />`
                    : ''
                }
              </div>
            </div>

            <div class="footer">
              <div>
                <b>
                  ${
                    paramsDocs?.pied_ligne1 ||
                    'Merci pour votre fidélité, à la prochaine !'
                  }
                </b>
              </div>

              <div>
                ${
                  paramsDocs?.pied_ligne2 ||
                  'La Qualité fait la différence.'
                }
              </div>

              <div>
                ${
                  paramsDocs?.mention_legale ||
                  'Les marchandises vendues ne peuvent être ni reprises, ni échangées.'
                }
              </div>
            </div>

            <div class="barcode-box">
              <img src="${barcodeUrl}" class="barcode" />
              <div class="small">Code Facture : ${infos.codeFacture}</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;
}

  function construireHtmlTicket() {
    if (!infos) return '';

    const dateVente = infos.dateVente ? new Date(infos.dateVente) : new Date();
    const logoUrl = documentImageUrl(paramsDocs?.logo_url);
    const barcodeUrl = genererCodeBarreBase64(infos.codeFacture);

    const lignesHtml =
      infos.lignes.length > 0
        ? infos.lignes
            .map((d: any) => {
              const devise = normaliserDevise(d.devise);
              const qte = Math.max(nombreDepuisTexte(d.quantite), 1);
              const pu = nombreDepuisTexte(d.prixunitaire) || montantLigne(d) / qte;

              return `
                <div class="ligne">
                  <div class="article">${d.nomproduit || d.designation || '-'}</div>
                  <div class="row">
                    <span>${qte} x ${formatMontant(pu, devise)} ${devise}</span>
                    <b>${formatMontant(montantLigne(d), devise)} ${devise}</b>
                  </div>
                </div>
              `;
            })
            .join('')
        : `<div class="center">Détails non chargés</div>`;

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Ticket ${infos.codeFacture}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            * { box-sizing: border-box; }
            body {
              width: 80mm;
              margin: 0 auto;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .logo { width: 55px; height: 55px; object-fit: contain; }
            h3 { margin: 4px 0; font-size: 13px; }
            .sep { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; gap: 8px; }
            .ligne { margin-bottom: 7px; }
            .article { font-weight: bold; margin-bottom: 2px; }
            .total { font-size: 13px; font-weight: bold; }
            .barcode { width: 60mm; height: 18mm; object-fit: contain; }
            .footer { line-height: 1.45; }
          </style>
        </head>
        <body>
          <div class="center">
            ${
  paramsDocs?.afficher_logo !== false && logoUrl
    ? `<img src="${logoUrl}" class="logo" />`
    : ''
}
<h3>${nomEntrepriseDocument(paramsDocs)}</h3>
${paramsDocs?.slogan ? `<div><b>${paramsDocs.slogan}</b></div>` : ''}
${paramsDocs?.adresse ? `<div>${paramsDocs.adresse}</div>` : ''}
${paramsDocs?.telephone ? `<div>Tél : ${paramsDocs.telephone}</div>` : ''}
${paramsDocs?.email ? `<div>${paramsDocs.email}</div>` : ''}
${paramsDocs?.site_web ? `<div>${paramsDocs.site_web}</div>` : ''}
<div>RCCM : ${paramsDocs?.rccm || '-'}</div>
<div>ID NAT : ${paramsDocs?.id_nat || '-'}</div>
          </div>

          <div class="sep"></div>

          <div>Facture : ${infos.codeFacture}</div>
          <div>Date : ${dateVente.toLocaleDateString('fr-FR')}</div>
          <div>Heure : ${dateVente.toLocaleTimeString('fr-FR')}</div>
          <div>Client : ${infos.nomClient}</div>
          <div>Caissier : ${infos.nomCaissier}</div>
          <div>Mode : ${infos.modePaiement}</div>

          <div class="sep"></div>

          ${lignesHtml}

          <div class="sep"></div>

          ${infos.totalUSD > 0 ? `<div class="row total"><span>TOTAL USD</span><span>${formatMontant(infos.totalUSD, 'USD')} USD</span></div>` : ''}
          ${infos.totalCDF > 0 ? `<div class="row total"><span>TOTAL CDF</span><span>${formatMontant(infos.totalCDF, 'CDF')} CDF</span></div>` : ''}
          ${infos.totalEUR > 0 ? `<div class="row total"><span>TOTAL EUR</span><span>${formatMontant(infos.totalEUR, 'EUR')} EUR</span></div>` : ''}

          <div class="sep"></div>

          <div class="center">
            <img src="${barcodeUrl}" class="barcode" />
            <div>Code Facture : ${infos.codeFacture}</div>
          </div>

          <div class="sep"></div>

          <div class="center footer">
           <b>${paramsDocs?.pied_ligne1 || 'Merci pour votre fidélité, à la prochaine !'}</b><br />
${paramsDocs?.pied_ligne2 || 'La Qualité fait la différence.'}<br />
${paramsDocs?.mention_legale || 'Les marchandises vendues ne peuvent être ni reprises, ni échangées.'}
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;
  }

  function imprimerA4() {
    const html = construireHtmlA4();
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function imprimerTicket() {
    const html = construireHtmlTicket();
    const win = window.open('', '_blank', 'width=420,height=700');
    if (!win) return;

    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function genererPdfA4() {
  if (!vente || !infos) return;

  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 12;
  const marginRight = 12;

  const dateVente = infos.dateVente ? new Date(infos.dateVente) : new Date();
  const dateOnly = dateVente.toLocaleDateString('fr-FR');
  const heureOnly = dateVente.toLocaleTimeString('fr-FR');
  const ticketNo = String(vente?.id_vente || id || Date.now()).padStart(6, '0');

  const logoUrl = documentImageUrl(paramsDocs?.logo_url);
  const barcodeFacture = genererCodeBarreBase64(infos.codeFacture);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(nomEntrepriseDocument(paramsDocs), marginLeft, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  let yEntete = 25;

  if (paramsDocs?.slogan) {
    doc.text(paramsDocs.slogan, marginLeft, yEntete);
    yEntete += 5;
  }

  if (paramsDocs?.adresse) {
    doc.text(paramsDocs.adresse, marginLeft, yEntete);
    yEntete += 5;
  }

  if (paramsDocs?.telephone) {
    doc.text(`Tél : ${paramsDocs.telephone}`, marginLeft, yEntete);
    yEntete += 5;
  }

  if (paramsDocs?.email) {
    doc.text(`Email : ${paramsDocs.email}`, marginLeft, yEntete);
    yEntete += 5;
  }

  if (paramsDocs?.site_web) {
    doc.text(`Site : ${paramsDocs.site_web}`, marginLeft, yEntete);
    yEntete += 5;
  }

  doc.text(`RCCM : ${paramsDocs?.rccm || '-'}`, marginLeft, yEntete);
  yEntete += 5;
  doc.text(`ID NAT : ${paramsDocs?.id_nat || '-'}`, marginLeft, yEntete);

  try {
    if (paramsDocs?.afficher_logo !== false && logoUrl) {
      doc.addImage(logoUrl, 'PNG', 158, 10, 38, 38);
    }
  } catch {}

  doc.setDrawColor(60, 60, 60);
  doc.line(marginLeft, 58, pageWidth - marginRight, 58);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ticket N°: ${ticketNo}`, marginLeft, 68);
  doc.text(`Date : ${dateOnly}`, marginLeft, 74);
  doc.text(`Heure : ${heureOnly}`, marginLeft, 80);

  doc.text(`FACTURE N° : ${infos.codeFacture}`, 108, 68);
  doc.text(`Caissier : ${infos.nomCaissier}`, 108, 74);
  doc.text(`Client : ${infos.nomClient}`, 108, 80);

  autoTable(doc, {
    startY: 100,
    margin: { left: marginLeft, right: marginRight, bottom: 18 },
    head: [['Article', 'Qté', 'PU', 'Devise', 'Total']],
    body:
      infos.lignes.length > 0
        ? infos.lignes.map((d: any) => {
            const devise = normaliserDevise(d.devise);
            const quantite = Math.max(nombreDepuisTexte(d.quantite), 1);
            const pu =
              nombreDepuisTexte(d.prixunitaire) || montantLigne(d) / quantite;

            return [
              d.nomproduit || d.designation || '-',
              String(d.quantite || 0),
              `${formatMontantPdf(pu, devise)} ${devise}`,
              devise,
              `${formatMontantPdf(montantLigne(d), devise)} ${devise}`,
            ];
          })
        : [['-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.3,
      lineColor: [190, 190, 190],
      lineWidth: 0.2,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [25, 35, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 78, halign: 'left' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 34, halign: 'right' },
    },
  });

  let y = ((doc as any).lastAutoTable?.finalY || 120) + 8;

  const devisesActives = [
    infos.totalUSD > 0 ? 'USD' : null,
    infos.totalCDF > 0 ? 'CDF' : null,
    infos.totalEUR > 0 ? 'EUR' : null,
  ].filter(Boolean) as string[];

  const totalParDevise: Record<string, number> = {
    USD: infos.totalUSD,
    CDF: infos.totalCDF,
    EUR: infos.totalEUR,
  };

  autoTable(doc, {
    startY: y,
    margin: { left: 75, right: marginRight, bottom: 18 },
    head: [['Devise', 'Total']],
    body: devisesActives.map((d) => [
      d,
      `${formatMontantPdf(totalParDevise[d], d)} ${d}`,
    ]),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'right',
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { fontStyle: 'bold', halign: 'right' },
    },
  });

  y = ((doc as any).lastAutoTable?.finalY || y) + 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  doc.text(
    paramsDocs?.pied_ligne1 || 'Merci pour votre fidélité, à la prochaine !',
    pageWidth / 2,
    y,
    { align: 'center' },
  );

  doc.text(
    paramsDocs?.pied_ligne2 || 'La Qualité fait la différence.',
    pageWidth / 2,
    y + 5,
    { align: 'center' },
  );

  doc.text(
    paramsDocs?.mention_legale ||
      'Les marchandises vendues ne peuvent être ni reprises, ni échangées.',
    pageWidth / 2,
    y + 12,
    { align: 'center' },
  );

  y += 18;

  if (y + 45 > pageHeight) {
    doc.addPage();
    y = 20;
  }

  doc.addImage(barcodeFacture, 'PNG', 62, y, 86, 20);
  doc.setFontSize(8.5);
  doc.text(infos.codeFacture, pageWidth / 2, y + 25, { align: 'center' });
  doc.text(`Code Facture : ${infos.codeFacture}`, pageWidth / 2, y + 31, {
    align: 'center',
  });

  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    doc.text(
      `${paramsDocs?.site_web || nomEntrepriseDocument(paramsDocs)} - Facture générée par MESSIE MATALA POS`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' },
    );
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - marginRight, pageHeight - 10, {
      align: 'right',
    });
  }

  doc.save(`facture-a4-${infos.codeFacture}.pdf`);
}

function genererPdfTicket() {
  if (!vente || !infos) return;

  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: [80, 220],
  });

  const barcode = genererCodeBarreBase64(infos.codeFacture);
  const dateVente = infos.dateVente ? new Date(infos.dateVente) : new Date();
  const logoUrl = documentImageUrl(paramsDocs?.logo_url);

  let y = 8;

  try {
    if (paramsDocs?.afficher_logo !== false && logoUrl) {
      doc.addImage(logoUrl, 'PNG', 30, y, 20, 20);
      y += 24;
    }
  } catch {}

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(nomEntrepriseDocument(paramsDocs), 40, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  if (paramsDocs?.slogan) {
    doc.text(paramsDocs.slogan, 40, y, { align: 'center' });
    y += 4;
  }

  if (paramsDocs?.adresse) {
    doc.text(paramsDocs.adresse, 40, y, { align: 'center', maxWidth: 70 });
    y += 5;
  }

  if (paramsDocs?.telephone) {
    doc.text(`Tél : ${paramsDocs.telephone}`, 40, y, { align: 'center' });
    y += 4;
  }

  if (paramsDocs?.email) {
    doc.text(paramsDocs.email, 40, y, { align: 'center' });
    y += 4;
  }

  if (paramsDocs?.site_web) {
    doc.text(paramsDocs.site_web, 40, y, { align: 'center' });
    y += 4;
  }

  doc.text(`RCCM : ${paramsDocs?.rccm || '-'}`, 40, y, { align: 'center' });
  y += 4;
  doc.text(`ID NAT : ${paramsDocs?.id_nat || '-'}`, 40, y, { align: 'center' });

  y += 8;
  doc.line(4, y, 76, y);
  y += 5;

  doc.text(`Facture : ${infos.codeFacture}`, 4, y);
  y += 4;
  doc.text(`Date : ${dateVente.toLocaleDateString('fr-FR')}`, 4, y);
  y += 4;
  doc.text(`Heure : ${dateVente.toLocaleTimeString('fr-FR')}`, 4, y);
  y += 4;
  doc.text(`Client : ${infos.nomClient}`, 4, y);
  y += 4;
  doc.text(`Caissier : ${infos.nomCaissier}`, 4, y);
  y += 4;
  doc.text(`Mode : ${infos.modePaiement}`, 4, y);

  y += 5;
  doc.line(4, y, 76, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: 4, right: 4 },
    head: [['Article', 'Qté', 'PU', 'Total']],
    body:
      infos.lignes.length > 0
        ? infos.lignes.map((d: any) => {
            const devise = normaliserDevise(d.devise);
            return [
              d.nomproduit || d.designation || '-',
              String(d.quantite || 0),
              formatMontantPdf(d.prixunitaire, devise),
              formatMontantPdf(montantLigne(d), devise),
            ];
          })
        : [['-', '-', '-', '-']],
    theme: 'plain',
    styles: {
      fontSize: 7,
      cellPadding: 1,
      overflow: 'linebreak',
    },
    headStyles: {
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 8, halign: 'center' },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 18, halign: 'right' },
    },
  });

  y = ((doc as any).lastAutoTable?.finalY || y) + 5;
  doc.line(4, y, 76, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  if (infos.totalUSD > 0) {
    doc.text(`TOTAL USD : ${formatMontantPdf(infos.totalUSD, 'USD')}`, 76, y, {
      align: 'right',
    });
    y += 5;
  }

  if (infos.totalCDF > 0) {
    doc.text(`TOTAL CDF : ${formatMontantPdf(infos.totalCDF, 'CDF')}`, 76, y, {
      align: 'right',
    });
    y += 5;
  }

  if (infos.totalEUR > 0) {
    doc.text(`TOTAL EUR : ${formatMontantPdf(infos.totalEUR, 'EUR')}`, 76, y, {
      align: 'right',
    });
    y += 5;
  }

  y += 3;
  doc.line(4, y, 76, y);
  y += 6;

  doc.addImage(barcode, 'PNG', 12, y, 56, 15);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Code Facture : ${infos.codeFacture}`, 40, y, { align: 'center' });

  y += 8;
  doc.text(
    paramsDocs?.pied_ligne1 || 'Merci pour votre fidélité, à la prochaine !',
    40,
    y,
    { align: 'center', maxWidth: 70 },
  );

  y += 4;
  doc.text(
    paramsDocs?.pied_ligne2 || 'La Qualité fait la différence.',
    40,
    y,
    { align: 'center', maxWidth: 70 },
  );

  y += 4;
  doc.text(
    paramsDocs?.mention_legale ||
      'Les marchandises vendues ne peuvent être ni reprises, ni échangées.',
    40,
    y,
    { align: 'center', maxWidth: 70 },
  );

  doc.save(`ticket-${infos.codeFacture}.pdf`);
}

  if (loading) {
    return <main className="p-6">Chargement...</main>;
  }

  if (!vente || !infos) {
    return <main className="p-6">Vente introuvable.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="overflow-hidden rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-200">
            MESSIE MATALA POS / Ventes
          </p>

          <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-black">Détail vente</h1>
              <p className="mt-2 text-sm text-emerald-50/80">
                Facture : {infos.codeFacture}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={imprimerA4}
    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
  >
    <Printer size={18} />
    Imprimer A4
  </button>

  <button
    type="button"
    onClick={imprimerTicket}
    className="flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
  >
    <Ticket size={18} />
    Imprimer Ticket
  </button>

  <button
    type="button"
    onClick={genererPdfA4}
    className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black text-white hover:bg-amber-600"
  >
    <FileText size={18} />
    PDF A4
  </button>

  <button
    type="button"
    onClick={genererPdfTicket}
    className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800"
  >
    <Ticket size={18} />
    PDF Ticket
  </button>

  <button
    type="button"
    onClick={() => router.push('/dashboard/ventes')}
    className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-50"
  >
    <ArrowLeft size={18} />
    Retour
  </button>
</div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-4">
          <InfoCard title="Client" value={infos.nomClient} />
          <InfoCard title="Caissier" value={infos.nomCaissier} />
          <InfoCard title="Paiement" value={infos.modePaiement} />
          <InfoCard title="Statut" value={infos.statut} />
        </div>
      </section>

      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-black text-slate-900">Résumé</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InfoLine
            label="Date vente"
            value={infos.dateVente ? new Date(infos.dateVente).toLocaleString('fr-FR') : '-'}
          />
          <InfoLine label="Téléphone client" value={infos.telephoneClient} />
          <InfoLine label="Facture" value={infos.codeFacture} />
          <InfoLine label="Nombre articles" value={String(infos.lignes.length)} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {infos.totalUSD > 0 && <TotalCard label="Total USD" value={`${formatMontant(infos.totalUSD, 'USD')} USD`} />}
          {infos.totalCDF > 0 && <TotalCard label="Total CDF" value={`${formatMontant(infos.totalCDF, 'CDF')} CDF`} />}
          {infos.totalEUR > 0 && <TotalCard label="Total EUR" value={`${formatMontant(infos.totalEUR, 'EUR')} EUR`} />}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b p-5">
          <h2 className="text-lg font-black text-slate-900">Articles vendus</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3 text-left">Référence</th>
                <th className="p-3 text-left">Article</th>
                <th className="p-3 text-center">Qté</th>
                <th className="p-3 text-right">PU</th>
                <th className="p-3 text-right">Remise</th>
                <th className="p-3 text-center">Devise</th>
                <th className="p-3 text-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {infos.lignes.map((d: any, i: number) => {
                const devise = normaliserDevise(d.devise);

                return (
                  <tr key={i} className="border-b hover:bg-emerald-50/40">
                    <td className="p-3">{d.refproduit || '-'}</td>
                    <td className="p-3 font-bold">{d.nomproduit || d.designation || '-'}</td>
                    <td className="p-3 text-center">{d.quantite || 0}</td>
                    <td className="p-3 text-right">{formatMontant(d.prixunitaire, devise)}</td>
                    <td className="p-3 text-right">{formatMontant(d.remise, devise)}</td>
                    <td className="p-3 text-center font-bold">{devise}</td>
                    <td className="p-3 text-right font-black">{formatMontant(montantLigne(d), devise)}</td>
                  </tr>
                );
              })}

              {infos.lignes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-bold text-red-600">
                    Détails non chargés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b p-5">
          <h2 className="text-lg font-black text-slate-900">Paiements</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="p-3 text-left">Mode</th>
                <th className="p-3 text-right">Montant</th>
                <th className="p-3 text-center">Devise</th>
                <th className="p-3 text-left">Référence</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Statut</th>
              </tr>
            </thead>

            <tbody>
              {infos.paiements.map((p: any, i: number) => {
                const devise = normaliserDevise(p.devise);

                return (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-bold">{p.modepaiement || '-'}</td>
                    <td className="p-3 text-right font-black">{formatMontant(p.montant, devise)}</td>
                    <td className="p-3 text-center font-bold">{devise}</td>
                    <td className="p-3">{p.referencetransaction || p.reference || '-'}</td>
                    <td className="p-3">
                      {p.datepaiement ? new Date(p.datepaiement).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-3">{p.statut || '-'}</td>
                  </tr>
                );
              })}

              {infos.paiements.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-bold text-slate-500">
                    Aucun paiement détaillé enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <h2 className="mt-2 break-words text-lg font-black text-emerald-950">
        {value || '-'}
      </h2>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value || '-'}</p>
    </div>
  );
}

function TotalCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-black uppercase text-emerald-700">{label}</p>
      <p className="mt-2 text-2xl font-black text-emerald-950">{value}</p>
    </div>
  );
}