'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

export default function VoirVentePage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;
  const [vente, setVente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerVente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function chargerVente() {
    try {
      const res = await fetch(`https://messiematala-pos-backend-production.up.railway.app/ventes/${id}`, {
        cache: 'no-store',
      });

      const texte = await res.text();
      console.log('REPONSE VENTE DETAIL:', res.status, texte);

      if (!res.ok) {
        throw new Error(`Erreur API ${res.status} : ${texte}`);
      }

      const data = JSON.parse(texte);

      const details = Array.isArray(data.details)
        ? data.details
        : Array.isArray(data.detailsvente)
        ? data.detailsvente
        : [];

      console.log('DETAILS RECUS FRONTEND:', details);

setVente({
  ...data,
  details: [...details],
  detailsvente: [...details],
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

    if (d === 'FC') return 'CDF';
    if (d === '$' || d === 'DOLLAR') return 'USD';

    return d || 'USD';
  }

  function nombreDepuisTexte(valeur: any): number {
    let texte = String(valeur ?? '0')
      .replace(/\$/g, '')
      .replace(/USD/gi, '')
      .replace(/CDF/gi, '')
      .replace(/FC/gi, '')
      .replace(/\s/g, '')
      .trim();

    if (texte.includes(',') && texte.includes('.')) {
      texte = texte.replace(/,/g, '');
    } else if (texte.includes(',') && !texte.includes('.')) {
      texte = texte.replace(',', '.');
    }

    const n = Number(texte);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMontant(montant: any): string {
    const n = nombreDepuisTexte(montant);

    return n
      .toFixed(2)
      .replace('.', ',')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

    JsBarcode(canvas, code || 'ZAIRE-POS', {
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

    console.log('LIGNES FINALES:', lignes);

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
      vente.paiements?.[0]?.modepaiement ||
      '-';

    const codeCarteFidelite =
      vente.codecarte ||
      vente.codecartefidelite ||
      vente.cartefidelite ||
      vente.code_carte_fidelite ||
      'FID-000000';

    const categorieClient =
      vente.categorieclient ||
      vente.categorie_client ||
      'STANDARD';

    const tauxFidelite = nombreDepuisTexte(vente.tauxfidelite || 0.5);
    const totalUSD = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'USD')
      .reduce((s: number, d: any) => s + montantLigne(d), 0);

    const totalCDF = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'CDF')
      .reduce((s: number, d: any) => s + montantLigne(d), 0);

    const totalEUR = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'EUR')
      .reduce((s: number, d: any) => s + montantLigne(d), 0);

    const remiseUSD = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'USD')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.remise), 0);

    const remiseCDF = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'CDF')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.remise), 0);

    const remiseEUR = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'EUR')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.remise), 0);

    const tvaUSD = 0;
    const tvaCDF = 0;
    const tvaEUR = 0;

    const gainFidelite =
      nombreDepuisTexte(vente.gainfidelite) ||
      Math.round(totalUSD * (tauxFidelite / 100) * 100) / 100;

    const soldeCashback =
      nombreDepuisTexte(vente.soldecashback) ||
      nombreDepuisTexte(vente.soldefidelite) ||
      0;

    return {
      lignes,
      codeFacture,
      nomClient,
      telephoneClient,
      nomCaissier,
      modePaiement,
      codeCarteFidelite,
      categorieClient,
      tauxFidelite,
      gainFidelite,
      soldeCashback,

      totalUSD,
      totalCDF,
      totalEUR,

      remiseUSD,
      remiseCDF,
      remiseEUR,

      tvaUSD,
      tvaCDF,
      tvaEUR,
    };
  }, [vente, id]);

  function imprimerTicket() {
    if (!vente || !infos) return;

    const barcode = genererCodeBarreBase64(infos.codeFacture);

    const dateOrdinateur = new Date();

const dateTicket =
  dateOrdinateur.toLocaleDateString('fr-FR');

const heureTicket =
  dateOrdinateur.toLocaleTimeString('fr-FR');


    const html = `
      <html>
        <head>
          <title>Ticket ${infos.codeFacture}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              width: 280px;
              margin: 0 auto;
              font-size: 12px;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { padding: 3px 0; }
            .right { text-align: right; }
            .total { font-size: 15px; font-weight: bold; }
            img { width: 240px; height: 55px; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:16px;">MESSIE MATALA POS</div>
          <div class="center">Entreprise : ZAIRE</div>
          <div class="center">Magasin : ZAIRE MASINA PLAZA</div>
          <div class="center">Caisse : POS MASINA PLAZA</div>

          <div class="line"></div>

          <div>Facture : <b>${infos.codeFacture}</b></div>
          <div>Date : ${new Date().toLocaleDateString('fr-FR')}</div>
<div>Heure : ${new Date().toLocaleTimeString('fr-FR')}</div>
          <div>Client : ${infos.nomClient}</div>
          <div>Caissier : ${infos.nomCaissier}</div>
          <div>Mode paiement : ${infos.modePaiement}</div>

          <div class="line"></div>

          <table>
            <thead>
              <tr>
                <th align="left">Article</th>
                <th>Qté</th>
                <th class="right">PU</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                infos.lignes.length > 0
                  ? infos.lignes
                      .map(
                        (d: any) => `
                    <tr>
                      <td>${d.nomproduit || ''}</td>
                      <td class="center">${d.quantite || 0}</td>
                      <td class="right">${formatMontant(d.prixunitaire)}</td>
                      <td class="right">${formatMontant(montantLigne(d))}</td>
                    </tr>
                  `
                      )
                      .join('')
                  : `<tr><td colspan="4">Détails non chargés</td></tr>`
              }
            </tbody>
          </table>

          <div class="line"></div>

          <div class="total right">
            ${infos.totalUSD > 0 ? `TOTAL USD : ${formatMontant(infos.totalUSD)}<br/>` : ''}
            ${infos.totalCDF > 0 ? `TOTAL CDF : ${formatMontant(infos.totalCDF)}<br/>` : ''}
            ${infos.totalEUR > 0 ? `TOTAL EUR : ${formatMontant(infos.totalEUR)}<br/>` : ''}
          </div>

          <div class="line"></div>

          <div class="center">
            <img src="${barcode}" />
            <div>Code Facture : ${infos.codeFacture}</div>
          </div>

          <div class="line"></div>

          <div class="center">
            Merci pour votre achat<br/>
            ZAIRE.CD
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    const win = window.open('', '_blank', 'width=350,height=650');
    if (!win) return;

    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function exporterPdfA4() {
  if (!vente || !infos) return;

  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 14;
  const marginRight = 14;

  function verifierEspace(y: number, hauteurNecessaire: number) {
    if (y + hauteurNecessaire > pageHeight - 20) {
      doc.addPage();
      return 20;
    }

    return y;
  }

  const dateOrdinateur = new Date();
  const dateOnly = dateOrdinateur.toLocaleDateString('fr-FR');
  const heureOnly = dateOrdinateur.toLocaleTimeString('fr-FR');

  const ticketNo = String(vente.id_vente || id || Date.now()).padStart(6, '0');

  const barcodeFacture = genererCodeBarreBase64(infos.codeFacture);
  const barcodeCarte = genererCodeBarreBase64(infos.codeCarteFidelite);

  const logoUrl = `${window.location.origin}/logo.png`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('ZAIRE MODE SARL', marginLeft, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('23, Bld Lumumba / Immeuble Masina Plaza', marginLeft, 25);
  doc.text('+243861507560 / E-MAIL: Zaireshop@hotmail.com', marginLeft, 30);
  doc.text('PAGE: ZAIRE.CD', marginLeft, 35);
  doc.text('RCCM: 25-B-01497', marginLeft, 40);
  doc.text('IDNAT: 01-F4300-N73258E', marginLeft, 45);

  try {
    doc.addImage(logoUrl, 'PNG', 158, 10, 38, 38);
  } catch (e) {
    console.log('Logo non chargé', e);
  }

  doc.setTextColor(245, 245, 245);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(58);
  doc.text('ZAIRE', 105, 160, {
    angle: 45,
    align: 'center',
  });
  doc.setTextColor(0, 0, 0);

  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
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
            return [
              d.nomproduit || '',
              String(d.quantite || 0),
              `${formatMontant(d.prixunitaire)} ${devise}`,
              devise,
              `${formatMontant(montantLigne(d))} ${devise}`,
            ];
          })
        : [['-', '-', '-', '-', '-']],
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.4,
      textColor: [20, 20, 20],
      lineColor: [190, 190, 190],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [25, 35, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 84 },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 34, halign: 'right' },
      3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 34, halign: 'right' },
    },
  });

  let y = ((doc as any).lastAutoTable?.finalY || 120) + 6;

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

  const remiseParDevise: Record<string, number> = {
    USD: infos.remiseUSD,
    CDF: infos.remiseCDF,
    EUR: infos.remiseEUR,
  };

  const tvaParDevise: Record<string, number> = {
    USD: infos.tvaUSD,
    CDF: infos.tvaCDF,
    EUR: infos.tvaEUR,
  };

  y = verifierEspace(y, 35);

  autoTable(doc, {
    startY: y,
    margin: { left: 78, right: marginRight, bottom: 18 },
    head: [['', ...devisesActives]],
    body: [
      ['Remise', ...devisesActives.map((d) => `${formatMontant(remiseParDevise[d])} ${d}`)],
      ['TVA', ...devisesActives.map((d) => `${formatMontant(tvaParDevise[d])} ${d}`)],
      ['TOTAL TTC', ...devisesActives.map((d) => `${formatMontant(totalParDevise[d])} ${d}`)],
    ],
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      lineColor: [190, 190, 190],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 54 },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  y = ((doc as any).lastAutoTable?.finalY || y) + 8;

  y = verifierEspace(y, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Mode : ${infos.modePaiement} | Totaux séparés par devise`, marginLeft, y);

  y += 7;

  y = verifierEspace(y, 45);

  doc.setDrawColor(190, 190, 190);
  doc.setFillColor(252, 252, 252);
  doc.rect(marginLeft, y, pageWidth - marginLeft - marginRight, 36, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FIDELITE CLIENT', marginLeft + 3, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Catégorie : ${infos.categorieClient}`, marginLeft + 3, y + 13);
  doc.text(`Taux : ${formatMontant(infos.tauxFidelite)}%`, marginLeft + 3, y + 18);
  doc.text(`Gain sur cette vente : ${formatMontant(infos.gainFidelite)} USD`, marginLeft + 3, y + 23);
  doc.text(`Solde Cashback : ${formatMontant(infos.soldeCashback)} USD`, marginLeft + 3, y + 28);
  doc.text(`Carte Fidelite : ${infos.codeCarteFidelite}`, marginLeft + 3, y + 33);

  y += 47;

  y = verifierEspace(y, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Merci pour votre fidélité, à la prochaine !', pageWidth / 2, y, { align: 'center' });
  doc.text('La Qualité fait la différence.', pageWidth / 2, y + 5, { align: 'center' });
  doc.text('Les marchandises vendues ne peuvent être ni reprises, ni échangées.', pageWidth / 2, y + 12, {
    align: 'center',
  });

  y += 16;

  y = verifierEspace(y, 80);

  doc.addImage(barcodeFacture, 'PNG', 62, y, 86, 20);
  doc.setFontSize(8.5);
  doc.text(infos.codeFacture, pageWidth / 2, y + 25, { align: 'center' });
  doc.text(`Code Facture : ${infos.codeFacture}`, pageWidth / 2, y + 31, { align: 'center' });

  if (infos.codeCarteFidelite && infos.codeCarteFidelite !== 'FID-000000') {
    doc.addImage(barcodeCarte, 'PNG', 70, y + 36, 70, 18);
    doc.text(infos.codeCarteFidelite, pageWidth / 2, y + 58, { align: 'center' });
    doc.text(`Carte Fidelite : ${infos.codeCarteFidelite}`, pageWidth / 2, y + 64, {
      align: 'center',
    });
  }

  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);

    doc.text('ZAIRE.CD - Facture générée par MESSIE MATALA POS', pageWidth / 2, 287, {
      align: 'center',
    });

    doc.text(`Page ${i} / ${totalPages}`, pageWidth - marginRight, 287, {
      align: 'right',
    });
  }

  doc.setTextColor(0, 0, 0);
  doc.save(`Facture_${infos.codeFacture}.pdf`);
}

if (loading) {
  return <main className="p-6">Chargement...</main>;
}

if (!vente || !infos) {
  return <main className="p-6">Vente introuvable.</main>;
}

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Détail vente</h1>
            <p className="text-slate-500">Facture : {infos.codeFacture}</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={imprimerTicket}
              className="rounded-lg bg-slate-700 px-4 py-2 font-bold text-white"
            >
              Imprimer Ticket
            </button>

            <button
              type="button"
              onClick={exporterPdfA4}
              className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white"
            >
              PDF
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg bg-slate-300 px-4 py-2 font-bold"
            >
              Retour
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-6 shadow">
  <div className="grid grid-cols-2 gap-4 text-sm">
    <div>
      <b>Date :</b>{' '}
      {new Date().toLocaleString('fr-FR')}
    </div>

    <div>
      <b>Client :</b> {infos.nomClient}
    </div>

    <div>
      <b>Caissier :</b> {infos.nomCaissier}
    </div>

    <div>
      <b>Mode paiement :</b> {infos.modePaiement}
    </div>

    <div>
      <b>Totaux :</b>
    </div>

    <div className="space-y-1">
      {infos.totalUSD > 0 && <div><b>USD :</b> {formatMontant(infos.totalUSD)}</div>}
      {infos.totalCDF > 0 && <div><b>CDF :</b> {formatMontant(infos.totalCDF)}</div>}
      {infos.totalEUR > 0 && <div><b>EUR :</b> {formatMontant(infos.totalEUR)}</div>}
    </div>
  </div>
</div>

<div className="mt-5 overflow-x-auto rounded-2xl bg-white p-6 shadow">
  <h2 className="mb-4 text-lg font-bold">Articles vendus</h2>

  <table className="w-full min-w-[800px] border-collapse text-sm">
    <thead className="bg-slate-900 text-white">
      <tr>
        <th className="border p-3">Référence</th>
        <th className="border p-3">Article</th>
        <th className="border p-3">Qté</th>
        <th className="border p-3">PU</th>
        <th className="border p-3">Devise</th>
        <th className="border p-3">Total</th>
      </tr>
    </thead>

    <tbody>
      {infos.lignes.length > 0 ? (
        infos.lignes.map((d: any, i: number) => (
          <tr key={i}>
            <td className="border p-3">{d.refproduit || '-'}</td>
            <td className="border p-3 font-bold">{d.nomproduit || '-'}</td>
            <td className="border p-3 text-center">{d.quantite || 0}</td>
            <td className="border p-3 text-right">{formatMontant(d.prixunitaire)}</td>
            <td className="border p-3 text-center">{normaliserDevise(d.devise)}</td>
            <td className="border p-3 text-right font-bold">
              {formatMontant(montantLigne(d))}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={6} className="p-8 text-center font-bold text-red-600">
            Détails non chargés
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
</main>
);
}