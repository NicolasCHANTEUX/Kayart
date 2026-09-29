"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  advanceTestOrderAction,
  deleteAdminOrderAction,
  markAdminOrderPaidAction
} from "@/app/admin/commandes/actions";
import type { AdminOrder } from "@/types/orders";

type AdminOrderActionsProps = {
  canPersist: boolean;
  order: AdminOrder;
  showOpenLink?: boolean;
};

export function AdminOrderActions({ canPersist, order, showOpenLink = false }: AdminOrderActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const canMarkPaid = canPersist && order.isManual && order.paymentStatus === "pending" && order.status === "pending";
  const testActionLabel = order.status === "paid"
    ? "Préparer le test"
    : order.status === "preparing"
      ? (order.fulfillmentMethod === "pickup" ? "Marquer prête" : "Marquer expédiée")
      : ["ready", "shipped"].includes(order.status)
        ? "Terminer le test"
        : null;

  return (
    <>
      <div className="order-actions">
        {showOpenLink ? <Link className="button button--ghost order-actions__button" href={`/admin/commandes/${order.id}`}>Ouvrir</Link> : null}

        {order.isTest ? (
          order.paymentStatus === "paid" && testActionLabel
            ? <form action={advanceTestOrderAction}><input type="hidden" name="id" value={order.id} /><input type="hidden" name="status" value={order.status} /><ActionButton label={testActionLabel} /></form>
            : <span className="order-actions__message">Confirmation Stripe automatique</span>
        ) : order.isManual && canMarkPaid ? <>
          <form action={markAdminOrderPaidAction}>
            <input name="id" type="hidden" value={order.id} />
            <ActionButton label="Marquer payé" />
          </form>
          <button className="button button--danger order-actions__button" onClick={() => setIsDeleteOpen(true)} type="button">Annuler la vente</button>
        </> : <span className="order-actions__message">Aucune action disponible</span>}
      </div>

      {isDeleteOpen ? <div className="modal-backdrop" role="presentation">
        <div aria-modal="true" className="admin-modal admin-modal--danger" role="dialog">
          <div>
            <span className="modal-eyebrow">Annulation de vente</span>
            <h2>{order.orderNumber}</h2>
            <p>La vente sera annulée et restera dans l’historique.</p>
          </div>
          <form action={deleteAdminOrderAction} className="modal-form">
            <input name="id" type="hidden" value={order.id} />
            <div className="modal-actions">
              <button className="button button--ghost" onClick={() => setIsDeleteOpen(false)} type="button">Retour</button>
              <ActionButton danger label="Annuler la vente" />
            </div>
          </form>
        </div>
      </div> : null}
    </>
  );
}

function ActionButton({ danger = false, label }: { danger?: boolean; label: string }) {
  const { pending } = useFormStatus();
  return <button className={`button ${danger ? "button--danger" : "button--ghost"} order-actions__button`} disabled={pending} type="submit">{pending ? "…" : label}</button>;
}
