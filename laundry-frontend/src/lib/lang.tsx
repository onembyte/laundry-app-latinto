"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type LanguageCode = "en" | "es" | "fr";

type LangContext = {
  lang: LanguageCode;
  setLang: (l: LanguageCode) => void;
};

const Ctx = createContext<LangContext | null>(null);

function detectDefault(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const fromStorage = (localStorage.getItem("lang") || "").toLowerCase();
  if (fromStorage === "en" || fromStorage === "es" || fromStorage === "fr") return fromStorage as LanguageCode;
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  if (nav === "es" || nav === "fr") return nav as LanguageCode;
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>("en");

  useEffect(() => {
    setLangState(detectDefault());
  }, []);

  useEffect(() => {
    // reflect in <html lang>
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);

  const value = useMemo<LangContext>(() => ({
    lang,
    setLang: (l) => setLangState(l),
  }), [lang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLanguage must be used within LanguageProvider");
  return v;
}

// Minimal strings to demonstrate language switching
export const STRINGS: Record<LanguageCode, Record<string, string>> = {
  en: {
    profile: "Profile",
    preferences: "Preferences",
    help: "Help",
    signout: "Sign out",
    language: "Language",
    language_desc: "Select the language for the entire site.",
    app_language: "App language",
    stored_locally: "Stored locally and applied instantly.",
    appearance: "Appearance",
    appearance_desc: "Choose how the app looks.",
    theme: "Theme",
    theme_hint: "Applies instantly and persists on this device.",
    account: "Account",
    account_desc: "Basic profile information.",
    name: "Name",
    email: "Email",
    avatar: "Avatar",
    upload_soon: "Upload controls coming soon",
    // actions
    action_receive: "Receive",
    action_deliver: "Deliver",
    action_edit: "Edit",
    action_status: "Status",
    // pages
    receive_title: "Receive Order",
    receive_desc: "Check in a new order and add basic details.",
    deliver_title: "Deliver Order",
    deliver_desc: "Mark an order as picked up or delivered.",
    edit_title: "Edit Order",
    edit_desc: "Find and modify order information.",
    status_title: "Order Status",
    status_desc: "Update the current state of an order.",
    stock: "Stock",
    stock_title: "Stock & Inventory",
    stock_desc: "Quick snapshot of core SKUs and quantities.",
    stock_add: "Add product",
    stock_form_title: "New product",
    stock_form_desc: "Create a product type and set a unit price.",
    stock_form_description: "Description",
    stock_form_price: "Price (ARG)",
    stock_form_submit: "Create",
    // status values
    st_in_process: "In process",
    st_done: "Done",
    st_delayed: "Delayed",
    st_paused: "Paused",
    pending_actions: "Pending actions",
    pending_orders: "Pending orders",
  },
  es: {
    profile: "Perfil",
    preferences: "Preferencias",
    help: "Ayuda",
    signout: "Cerrar sesión",
    language: "Idioma",
    language_desc: "Selecciona el idioma de todo el sitio.",
    app_language: "Idioma de la app",
    stored_locally: "Se guarda localmente y se aplica al instante.",
    appearance: "Apariencia",
    appearance_desc: "Elige cómo se ve la aplicación.",
    theme: "Tema",
    theme_hint: "Se aplica al instante y persiste en este dispositivo.",
    account: "Cuenta",
    account_desc: "Información básica del perfil.",
    name: "Nombre",
    email: "Correo",
    avatar: "Avatar",
    upload_soon: "Controles de subida próximamente",
    // actions
    action_receive: "Recibir",
    action_deliver: "Entregar",
    action_edit: "Editar",
    action_status: "Estado",
    // pages
    receive_title: "Recibir orden",
    receive_desc: "Registrar una nueva orden y agregar datos básicos.",
    deliver_title: "Entregar orden",
    deliver_desc: "Marcar una orden como retirada o entregada.",
    edit_title: "Editar orden",
    edit_desc: "Buscar y modificar información de la orden.",
    status_title: "Estado de la orden",
    status_desc: "Actualizar el estado actual de una orden.",
    stock: "Stock",
    stock_title: "Stock e Inventario",
    stock_desc: "Vista rápida de SKUs principales y cantidades.",
    stock_add: "Agregar producto",
    stock_form_title: "Nuevo producto",
    stock_form_desc: "Crea un tipo de producto y define su precio unitario.",
    stock_form_description: "Descripción",
    stock_form_price: "Precio (USD)",
    stock_form_submit: "Crear",
    // status values
    st_in_process: "En proceso",
    st_done: "Listo",
    st_delayed: "Demorada",
    st_paused: "Pausada",
    pending_actions: "Acciones pendientes",
    pending_orders: "Órdenes pendientes",
  },
  fr: {
    profile: "Profil",
    preferences: "Préférences",
    help: "Aide",
    signout: "Se déconnecter",
    language: "Langue",
    language_desc: "Sélectionnez la langue du site.",
    app_language: "Langue de l'application",
    stored_locally: "Stocké localement et appliqué instantanément.",
    appearance: "Apparence",
    appearance_desc: "Choisissez l'apparence de l'application.",
    theme: "Thème",
    theme_hint: "S'applique instantanément et persiste sur cet appareil.",
    account: "Compte",
    account_desc: "Informations de profil basiques.",
    name: "Nom",
    email: "Email",
    avatar: "Avatar",
    upload_soon: "Contrôles de téléchargement bientôt",
    // actions
    action_receive: "Réception",
    action_deliver: "Remise",
    action_edit: "Éditer",
    action_status: "Statut",
    // pages
    receive_title: "Recevoir une commande",
    receive_desc: "Enregistrer une nouvelle commande et les détails de base.",
    deliver_title: "Remettre la commande",
    deliver_desc: "Marquer une commande comme retirée ou livrée.",
    edit_title: "Modifier la commande",
    edit_desc: "Rechercher et modifier les informations de la commande.",
    status_title: "Statut de la commande",
    status_desc: "Mettre à jour l'état actuel d'une commande.",
    stock: "Stock",
    stock_title: "Stock et Inventaire",
    stock_desc: "Instantané des principaux SKU et quantités.",
    stock_add: "Ajouter un produit",
    stock_form_title: "Nouveau produit",
    stock_form_desc: "Créez un type de produit et définissez son prix unitaire.",
    stock_form_description: "Description",
    stock_form_price: "Prix (USD)",
    stock_form_submit: "Créer",
    // status values
    st_in_process: "En cours",
    st_done: "Terminé",
    st_delayed: "Retardé",
    st_paused: "En pause",
    pending_actions: "Actions en attente",
    pending_orders: "Commandes en attente",
  },
};

export function useStrings() {
  const { lang } = useLanguage();
  return STRINGS[lang];
}
