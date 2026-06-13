'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';

const API = 'https://messiematala-pos-backend-production.up.railway.app';

export default function VoirVentePage() {
  const router = useRouter();

  const [id, setId] = useState<string | null>(null);
  const [vente, setVente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get('id'));
  }, []);

  useEffect(() => {
    if (!id) return;
    chargerVente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

      const data = JSON.parse(texte);

      const details = Array.isArray(data.details)
        ? data.details
        : Array.isArray(data.detailsvente)
        ? data.detailsvente
        : [];

      const paiements = Array.isArray(data.paiements) ? data.paiements : [];

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

    if (d === 'FC') return 'CDF';
    if (d === '$' || d === 'DOLLAR') return 'USD';
    if (d === 'EURO') return 'EUR';

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

    return n.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
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

    const tvaUSD = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'USD')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.tva), 0);

    const tvaCDF = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'CDF')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.tva), 0);

    const tvaEUR = lignes
      .filter((x: any) => normaliserDevise(x.devise) === 'EUR')
      .reduce((s: number, d: any) => s + nombreDepuisTexte(d.tva), 0);

    const tauxFidelite = nombreDepuisTexte(vente.tauxfidelite || 0.5);

    const gainFidelite =
      nombreDepuisTexte(vente.gainfidelite) ||
      Math.round(totalUSD * (tauxFidelite / 100) * 100) / 100;

    const soldeCashback =
      nombreDepuisTexte(vente.soldecashback) ||
      nombreDepuisTexte(vente.soldefidelite) ||
      0;

    return {
      lignes,
      paiements,
      codeFacture,
      nomClient,
      telephoneClient,
      nomCaissier,
      modePaiement,

      codeCarteFidelite:
        vente.codecarte ||
        vente.codecartefidelite ||
        vente.cartefidelite ||
        vente.code_carte_fidelite ||
        'FID-000000',

      categorieClient:
        vente.categorieclient ||
        vente.categorie_client ||
        'STANDARD',

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

      statut: vente.statut || 'VALIDEE',
      dateVente: vente.datevente || vente.createdat || null,
    };
  }, [vente, id]);

  function imprimerTicket(duplicata = false) {
    if (!vente || !infos) return;

    const barcode = genererCodeBarreBase64(infos.codeFacture);

    const html = `
      <html>
        <head>
          <title>${duplicata ? 'Duplicata' : 'Ticket'} ${infos.codeFacture}</title>
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
            .dup { font-size: 14px; font-weight: bold; border: 1px solid #000; padding: 4px; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:16px;">MESSIE MATALA POS</div>
          <div class="center">Entreprise : ZAIRE</div>
          <div class="center">Magasin : ZAIRE MASINA PLAZA</div>
          <div class="center">Caisse : POS MASINA PLAZA</div>
          ${duplicata ? '<div class="center dup">DUPLICATA</div>' : ''}

          <div class="line"></div>

          <div>Facture : <b>${infos.codeFacture}</b></div>
          <div>Date : ${
            infos.dateVente
              ? new Date(infos.dateVente).toLocaleDateString('fr-FR')
              : new Date().toLocaleDateString('fr-FR')
          }</div>
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
                      <td>${d.nomproduit || '-'}</td>
                      <td class="center">${d.quantite || 0}</td>
                      <td class="right">${formatMontant(d.prixunitaire)}</td>
                      <td class="right">${formatMontant(montantLigne(d))}</td>
                    </tr>
                  `,
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

  function imprimerA4(duplicata = false) {
    if (!vente || !infos) return;

    const doc = new jsPDF('p', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 14;
    const marginRight = 14;

    function verifierEspace(y: number, h: number) {
      if (y + h > pageHeight - 20) {
        doc.addPage();
        return 20;
      }

      return y;
    }

    const dateVente = infos.dateVente ? new Date(infos.dateVente) : new Date();
    const dateOnly = dateVente.toLocaleDateString('fr-FR');
    const heureOnly = dateVente.toLocaleTimeString('fr-FR');

    const ticketNo = String(vente.id_vente || id || Date.now()).padStart(6, '0');
    const barcodeFacture = genererCodeBarreBase64(infos.codeFacture);
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

    if (duplicata) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('DUPLICATA', pageWidth / 2, 54, { align: 'center' });
    }

    doc.setTextColor(245, 245, 245);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(58);
    doc.text(duplicata ? 'DUPLICATA' : 'ZAIRE', 105, 160, {
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
                d.nomproduit || '-',
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
      USD: infos.remiseUSD || 0,
      CDF: infos.remiseCDF || 0,
      EUR: infos.remiseEUR || 0,
    };

    const tvaParDevise: Record<string, number> = {
      USD: infos.tvaUSD || 0,
      CDF: infos.tvaCDF || 0,
      EUR: infos.tvaEUR || 0,
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

    const totalPages = doc.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);

      doc.text('ZAIRE.CD - Facture générée par MESSIE MATALA POS', pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });

      doc.text(`Page ${i} / ${totalPages}`, pageWidth - marginRight, pageHeight - 10, {
        align: 'right',
      });
    }

    doc.setTextColor(0, 0, 0);

    const pdfUrl = doc.output('bloburl');
    const win = window.open(pdfUrl, '_blank');

    if (win) {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 800);
    }
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
                onClick={() => imprimerTicket(false)}
                className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-black text-white hover:bg-slate-600"
              >
                Imprimer ticket
              </button>

              <button
                type="button"
                onClick={() => imprimerA4(false)}
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-500"
              >
                Impr. A4
              </button>

              <button
                type="button"
                onClick={() => imprimerA4(true)}
                className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
              >
                Duplicata A4
              </button>

              <button
                type="button"
                onClick={() => imprimerTicket(true)}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-500"
              >
                Duplicata ticket
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard/ventes')}
                className="rounded-xl bg-white px-4 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-50"
              >
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
          <InfoLine label="Date vente" value={infos.dateVente ? new Date(infos.dateVente).toLocaleString('fr-FR') : '-'} />
          <InfoLine label="Téléphone client" value={infos.telephoneClient} />
          <InfoLine label="Facture" value={infos.codeFacture} />
          <InfoLine label="Nombre articles" value={String(infos.lignes.length)} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {infos.totalUSD > 0 && <TotalCard label="Total USD" value={`${formatMontant(infos.totalUSD)} USD`} />}
          {infos.totalCDF > 0 && <TotalCard label="Total CDF" value={`${formatMontant(infos.totalCDF)} CDF`} />}
          {infos.totalEUR > 0 && <TotalCard label="Total EUR" value={`${formatMontant(infos.totalEUR)} EUR`} />}
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
              {infos.lignes.map((d: any, i: number) => (
                <tr key={i} className="border-b hover:bg-emerald-50/40">
                  <td className="p-3">{d.refproduit || '-'}</td>
                  <td className="p-3 font-bold">{d.nomproduit || '-'}</td>
                  <td className="p-3 text-center">{d.quantite || 0}</td>
                  <td className="p-3 text-right">{formatMontant(d.prixunitaire)}</td>
                  <td className="p-3 text-right">{formatMontant(d.remise)}</td>
                  <td className="p-3 text-center font-bold">{normaliserDevise(d.devise)}</td>
                  <td className="p-3 text-right font-black">{formatMontant(montantLigne(d))}</td>
                </tr>
              ))}

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
              {infos.paiements.map((p: any, i: number) => (
                <tr key={i} className="border-b hover:bg-slate-50">
                  <td className="p-3 font-bold">{p.modepaiement || '-'}</td>
                  <td className="p-3 text-right font-black">{formatMontant(p.montant)}</td>
                  <td className="p-3 text-center font-bold">{normaliserDevise(p.devise)}</td>
                  <td className="p-3">{p.referencetransaction || p.reference || '-'}</td>
                  <td className="p-3">
                    {p.datepaiement ? new Date(p.datepaiement).toLocaleString('fr-FR') : '-'}
                  </td>
                  <td className="p-3">{p.statut || '-'}</td>
                </tr>
              ))}

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