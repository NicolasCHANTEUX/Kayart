"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteAdminOrderAction,
  advanceTestOrderAction,
  markAdminOrderPaidAction
} from "@/app/admin/commandes/actions";
import type { AdminOrder } from "@/types/orders";

type AdminOrderActionsProps = {
  canPersist: boolean;
  order: AdminOrder;
};

export function AdminOrderActions({ canPersist, order }: AdminOrderActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const canMarkPaid = canPersist && order.isManual && order.paymentStatus === "pending" && order.status === "pending";

  if (order.isTest) {
    const label = order.status === "paid" ? "Préparer le test" : order.status === "preparing" ? (order.fulfillmentMethod === "pickup" ? "Marquer prête" : "Marquer expédiée") : ["ready", "shipped"].includes(order.status) ? "Terminer le test" : null;
    return order.paymentStatus === "paid" && label ? <form action={advanceTestOrderAction}><input type="hidden" name="id" value={order.id} /><input type="hidden" name="status" value={order.status} /><ActionButton label={label} /></form> : <span>Confirmation Stripe automatique</span>;
  }

  return (
    <>
      <div className="order-actions">
        <form action={markAdminOrderPaidAction}>
          <input name="id" type="hidden" value={order.id} />
          <ActionButton disabled={!canMarkPaid} label="Marquer payé" />
        </form>
        <button
          className="button button--danger order-actions__button"
          disabled={!canMarkPaid}
          onClick={() => setIsDeleteOpen(true)}
          type="button"
        >
          Annuler la vente
        </button>
      </div>

      {isDeleteOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div aria-modal="true" className="admin-modal admin-modal--danger" role="dialog">
            <div>
              <span className="modal-eyebrow">Annulation de vente</span>
              <h2>{order.orderNumber}</h2>
              <p>La vente sera annulée et restera dans l'historique.</p>
            </div>
            <form action={deleteAdminOrderAction} className="modal-form">
              <input name="id" type="hidden" value={order.id} />
              <div className="modal-actions">
                <button className="button button--ghost" onClick={() => setIsDeleteOpen(false)} type="button">
                  Annuler
                </button>
                <ActionButton danger label="Annuler la vente" />
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ActionButton({
  danger = false,
  disabled = false,
  label
}: {
  danger?: boolean;
  disabled?: boolean;
  label: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={danger ? "button button--primary" : "button button--ghost order-actions__button"}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "..." : label}
    </button>
  );
}
