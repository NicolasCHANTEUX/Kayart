"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteAdminOrderAction,
  markAdminOrderPaidAction
} from "@/app/admin/commandes/actions";
import type { AdminOrder } from "@/types/orders";

type AdminOrderActionsProps = {
  canPersist: boolean;
  order: AdminOrder;
};

export function AdminOrderActions({ canPersist, order }: AdminOrderActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const canMarkPaid = canPersist && order.paymentStatus !== "paid";

  return (
    <>
      <div className="order-actions">
        <form action={markAdminOrderPaidAction}>
          <input name="id" type="hidden" value={order.id} />
          <ActionButton disabled={!canMarkPaid} label="Marquer payé" />
        </form>
        <button
          className="button button--danger order-actions__button"
          disabled={!canPersist}
          onClick={() => setIsDeleteOpen(true)}
          type="button"
        >
          Supprimer
        </button>
      </div>

      {isDeleteOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div aria-modal="true" className="admin-modal admin-modal--danger" role="dialog">
            <div>
              <span className="modal-eyebrow">Suppression commande</span>
              <h2>{order.orderNumber}</h2>
              <p>Cette commande factice sera supprimée de l'historique.</p>
            </div>
            <form action={deleteAdminOrderAction} className="modal-form">
              <input name="id" type="hidden" value={order.id} />
              <div className="modal-actions">
                <button className="button button--ghost" onClick={() => setIsDeleteOpen(false)} type="button">
                  Annuler
                </button>
                <ActionButton danger label="Supprimer" />
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
