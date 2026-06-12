import VenteClient from './VenteClient';

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function Page() {
  return <VenteClient />;
}
