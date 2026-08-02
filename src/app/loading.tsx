export default function Loading() {
  return (
    <div aria-live="polite" className="route-loading-screen" role="status">
      <span aria-hidden="true" className="route-loading-indicator" />
      <span className="sr-only">Chargement de la page</span>
    </div>
  );
}
