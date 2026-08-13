// src/components/ExpenseForm.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ExpenseConceptSelect from "./ExpenseConceptSelect";
import {
  useCategories,
  useVendors,
  usePaymentAccounts,
  useExpenseConcepts,
  useCreateExpenseConcept,
} from "@/api/hooks";

const TAX_RATE = 0.09;
const normalize = (s = "") => s.toString().trim().toLowerCase();

function makeDefaults() {
  return {
    date: new Date().toISOString().slice(0, 10),
    category_id: "",
    expense_concept_id: "",
    vendor_id: "",
    payment_method: "",
    payment_account_id: "",
    receipt_url: "",
    description: "",
    notes: "",
    apply_tax: true,

    s_quantity: "",
    s_unit_price: "",

    gallons_miles: "",
    c_unit_price: "",
    c_expense_type: "Fuel",
    c_other_subtotal: "",

    g_subtotal: "",
    g_expense_type: "General",

    h_helper_name: "",
    h_task_project: "",
    h_hours: "",
    h_rate: "",
    h_paid: false,
  };
}

function inferModeFromCategoryName(name = "") {
  if (!name) return null;
  const n = normalize(name);

  if (
    [
      "helpers",
      "helper",
      "payroll",
      "labor",
      "wages",
      "sueldo",
      "sueldos",
      "pago ayudante",
      "pago ayudantes",
    ].some((k) => n.includes(k))
  ) {
    return "HELPERS";
  }

  if (["supplies", "supply", "insumos"].some((k) => n.includes(k))) {
    return "SUPPLIES";
  }

  if (
    ["general expenses", "general", "gastos generales"].some((k) =>
      n.includes(k),
    )
  ) {
    return "GENERAL";
  }

  if (
    ["car", "gas", "gasoline", "fuel", "auto", "vehículo", "vehiculo"].some(
      (k) => n.includes(k),
    )
  ) {
    return "CAR";
  }

  return "OTHER";
}

function getDateValue(date) {
  if (!date) return new Date().toISOString().slice(0, 10);
  return String(date).slice(0, 10);
}

function buildFormValuesFromExpense(expense, categories) {
  const defaults = makeDefaults();

  if (!expense) return defaults;

  const categoryId = expense.category_id ?? expense.category?.id ?? "";
  const category = categories.find((c) => String(c.id) === String(categoryId));
  const mode = inferModeFromCategoryName(category?.name ?? "");

  const baseValues = {
    ...defaults,
    date: getDateValue(expense.date),
    category_id: categoryId ? String(categoryId) : "",
    expense_concept_id: expense.expense_concept_id
      ? String(expense.expense_concept_id)
      : "",
    vendor_id: expense.vendor_id ? String(expense.vendor_id) : "",
    payment_method: expense.payment_method ?? "",
    payment_account_id: expense.payment_account_id
      ? String(expense.payment_account_id)
      : "",
    receipt_url: expense.receipt_url ?? "",
    description: expense.description ?? "",
    notes: expense.notes ?? "",
    apply_tax: !!expense.apply_tax,
  };

  if (mode === "SUPPLIES") {
    return {
      ...baseValues,
      s_quantity: expense.quantity ?? "",
      s_unit_price: expense.unit_price ?? "",
    };
  }

  if (mode === "CAR") {
    const expenseType = expense.expense_type || "Fuel";

    if (expenseType === "Fuel") {
      return {
        ...baseValues,
        c_expense_type: "Fuel",
        gallons_miles: expense.gallons_miles ?? expense.quantity ?? "",
        c_unit_price: expense.unit_price ?? "",
      };
    }

    if (expenseType === "Maintenance") {
      return {
        ...baseValues,
        c_expense_type: "Maintenance",
        c_unit_price: expense.unit_price ?? expense.total ?? "",
      };
    }

    return {
      ...baseValues,
      c_expense_type: "Other",
      c_other_subtotal: expense.unit_price ?? expense.total ?? "",
    };
  }

  if (mode === "HELPERS") {
    return {
      ...baseValues,
      h_helper_name: expense.helper_name ?? "",
      h_task_project: expense.task_project ?? "",
      h_hours: expense.quantity ?? "",
      h_rate: expense.unit_price ?? "",
      h_paid: !!expense.paid,
      apply_tax: false,
    };
  }

  return {
    ...baseValues,
    g_expense_type: expense.expense_type || "General",
    g_subtotal: expense.unit_price ?? expense.total ?? "",
  };
}

export default function ExpenseForm({
  onSubmit: submit,
  isSubmitting,
  expenseToEdit = null,
  onCancelEdit,
}) {
  const isEditing = !!expenseToEdit;
  const skipNextPaymentAccountClearRef = useRef(false);
  const pendingPaymentAccountIdRef = useRef(null);
  const previousPaymentMethodRef = useRef("");
  const previousCategoryIdRef = useRef("");
  const skipNextCategoryConceptClearRef = useRef(false);

  const [showConceptModal, setShowConceptModal] = useState(false);
  const [newConceptName, setNewConceptName] = useState("");
  const [conceptCreateError, setConceptCreateError] = useState("");
  const [locallyCreatedConcepts, setLocallyCreatedConcepts] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: makeDefaults(),
  });

  const { data: categories = [] } = useCategories();
  const { data: vendors = [] } = useVendors();

  const categoryId = watch("category_id");

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(categoryId)),
    [categories, categoryId],
  );

  const mode = useMemo(
    () => inferModeFromCategoryName(selectedCategory?.name ?? ""),
    [selectedCategory],
  );

  const hasCategory = !!selectedCategory && !!mode;

  const apply_tax = watch("apply_tax");
  const carType = watch("c_expense_type");
  const paymentMethod = watch("payment_method");

  const usesExpenseConcept =
    mode === "SUPPLIES" ||
    mode === "GENERAL" ||
    mode === "OTHER" ||
    (mode === "CAR" && carType !== "Fuel");

  const { data: expenseConcepts = [], isFetching: isLoadingExpenseConcepts } =
    useExpenseConcepts(categoryId, usesExpenseConcept);

  const availableExpenseConcepts = useMemo(() => {
    const currentCategoryId = Number(categoryId);

    const localItems = locallyCreatedConcepts.filter(
      (concept) => Number(concept.category_id) === currentCategoryId,
    );

    const merged = [...expenseConcepts, ...localItems];

    return Array.from(
      new Map(merged.map((concept) => [String(concept.id), concept])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryId, expenseConcepts, locallyCreatedConcepts]);

  const expenseConceptId = watch("expense_concept_id");

  const createExpenseConcept = useCreateExpenseConcept();

  const { data: paymentAccounts = [], isFetching: isLoadingAccounts } =
    usePaymentAccounts(paymentMethod);

  useEffect(() => {
    console.log("[ExpenseForm] expenseToEdit:", expenseToEdit);
  }, [expenseToEdit]);

  useEffect(() => {
    console.log("[ExpenseForm] paymentMethod:", paymentMethod);
    console.log("[ExpenseForm] paymentAccounts:", paymentAccounts);
    console.log("[ExpenseForm] isLoadingAccounts:", isLoadingAccounts);
  }, [paymentMethod, paymentAccounts, isLoadingAccounts]);

  useEffect(() => {
    if (!expenseToEdit) {
      console.log("[ExpenseForm] No expenseToEdit. Reset defaults.");

      reset(makeDefaults());
      pendingPaymentAccountIdRef.current = null;
      return;
    }

    if (categories.length === 0) {
      console.log("[ExpenseForm] Waiting for categories before reset...");
      return;
    }

    const formValues = buildFormValuesFromExpense(expenseToEdit, categories);

    console.log("[ExpenseForm] categories:", categories);
    console.log("[ExpenseForm] formValues before reset:", formValues);
    console.log(
      "[ExpenseForm] pending payment account id:",
      formValues.payment_account_id,
    );

    skipNextPaymentAccountClearRef.current = true;
    skipNextCategoryConceptClearRef.current = true;
    pendingPaymentAccountIdRef.current = formValues.payment_account_id || null;

    reset(formValues);
  }, [expenseToEdit, categories, reset]);

  useEffect(() => {
    const previousPaymentMethod = previousPaymentMethodRef.current;
    previousPaymentMethodRef.current = paymentMethod || "";

    if (skipNextPaymentAccountClearRef.current) {
      skipNextPaymentAccountClearRef.current = false;
      return;
    }

    // Evita limpiar la cuenta durante la carga inicial del Edit.
    if (
      isEditing &&
      expenseToEdit?.payment_method &&
      paymentMethod === expenseToEdit.payment_method
    ) {
      return;
    }

    // Evita limpiar cuando todavía estamos pasando de vacío a CARD/BANK/CASH
    // por el reset() del formulario.
    if (!previousPaymentMethod) {
      return;
    }

    setValue("payment_account_id", "");
    pendingPaymentAccountIdRef.current = null;
  }, [paymentMethod, isEditing, expenseToEdit, setValue]);

  useEffect(() => {
    if (!isEditing) return;
    if (!expenseToEdit?.payment_account_id) return;
    if (!paymentMethod) return;
    if (isLoadingAccounts) return;
    if (paymentAccounts.length === 0) return;

    // Solo autoseleccionar si el método actual corresponde al método guardado.
    if (
      expenseToEdit?.payment_method &&
      paymentMethod !== expenseToEdit.payment_method
    ) {
      return;
    }

    const accountId = String(expenseToEdit.payment_account_id);

    const exists = paymentAccounts.some(
      (account) => String(account.id) === accountId,
    );

    if (!exists) {
      console.warn("[ExpenseForm] Saved payment account was not found:", {
        accountId,
        paymentMethod,
        availableAccounts: paymentAccounts,
      });
      return;
    }

    setValue("payment_account_id", accountId, {
      shouldDirty: false,
      shouldValidate: true,
    });

    pendingPaymentAccountIdRef.current = null;
  }, [
    isEditing,
    expenseToEdit,
    paymentMethod,
    isLoadingAccounts,
    paymentAccounts,
    setValue,
  ]);

  useEffect(() => {
    const previousCategoryId = previousCategoryIdRef.current;
    previousCategoryIdRef.current = categoryId || "";

    if (skipNextCategoryConceptClearRef.current) {
      skipNextCategoryConceptClearRef.current = false;
      return;
    }

    if (!previousCategoryId) return;

    if (String(previousCategoryId) !== String(categoryId || "")) {
      setValue("expense_concept_id", "");
    }
  }, [categoryId, setValue]);

  useEffect(() => {
    if (!hasCategory) return;

    if (!usesExpenseConcept) {
      setValue("expense_concept_id", "");
    }
  }, [hasCategory, usesExpenseConcept, setValue]);

  const sQty = Number(watch("s_quantity") || 0);
  const sUnitPrice = Number(watch("s_unit_price") || 0);
  const suppliesSubtotal = +(sQty * sUnitPrice).toFixed(2);
  const suppliesTax = +(apply_tax ? suppliesSubtotal * TAX_RATE : 0).toFixed(2);
  const suppliesTotal = +(suppliesSubtotal + suppliesTax).toFixed(2);

  const gallons = Number(watch("gallons_miles") || 0);
  const cUnitPrice = Number(watch("c_unit_price") || 0);
  const carFuelSubtotal = +(gallons * cUnitPrice).toFixed(2);
  const carFuelTax = +(apply_tax ? carFuelSubtotal * TAX_RATE : 0).toFixed(2);
  const carFuelTotal = +(carFuelSubtotal + carFuelTax).toFixed(2);

  const carMaintSubtotal = +(cUnitPrice * 1).toFixed(2);
  const carMaintTax = +(apply_tax ? carMaintSubtotal * TAX_RATE : 0).toFixed(2);
  const carMaintTotal = +(carMaintSubtotal + carMaintTax).toFixed(2);

  const cOtherSubtotal = Number(watch("c_other_subtotal") || 0);
  const cOtherTax = +(apply_tax ? cOtherSubtotal * TAX_RATE : 0).toFixed(2);
  const cOtherTotal = +(cOtherSubtotal + cOtherTax).toFixed(2);

  const gSubtotal = Number(watch("g_subtotal") || 0);
  const gTax = +(apply_tax ? gSubtotal * TAX_RATE : 0).toFixed(2);
  const gTotal = +(gSubtotal + gTax).toFixed(2);

  const hHours = Number(watch("h_hours") || 0);
  const hRate = Number(watch("h_rate") || 0);
  const helpersTotal = +(hHours * hRate).toFixed(2);

  const vendorLabel = "Vendor";

  useEffect(() => {
    if (!hasCategory) return;
    if (isEditing) return;

    setValue("expense_concept_id", "");
    setValue("description", "");
    setValue("notes", "");
    setValue("gallons_miles", "");
    setValue("c_unit_price", "");
    setValue("c_other_subtotal", "");
    setValue("s_quantity", "");
    setValue("s_unit_price", "");
    setValue("g_subtotal", "");
    setValue("g_expense_type", "General");
    setValue("c_expense_type", "Fuel");

    setValue("h_helper_name", "");
    setValue("h_task_project", "");
    setValue("h_hours", "");
    setValue("h_rate", "");
    setValue("h_paid", false);
  }, [hasCategory, isEditing, categoryId, setValue]);

  const onSubmit = async (data) => {
    console.log("[ExpenseForm] submit raw data:", data);
    if (!hasCategory) return;

    const tax_applied = !!data.apply_tax;
    const payment_method = data.payment_method || null;
    const payment_account_id = data.payment_account_id
      ? Number(data.payment_account_id)
      : null;

    let expense_type = null;
    let quantity = null;
    let unit = null;
    let unit_price = null;
    let gallons_miles = null;
    let total = null;
    let description = (data.description || "").trim();
    let receipt_url = data.receipt_url || "";
    let notes = (data.notes || "").trim();

    const expense_concept_id = data.expense_concept_id
      ? Number(data.expense_concept_id)
      : null;

    const selectedExpenseConcept = availableExpenseConcepts.find(
      (concept) => String(concept.id) === String(expense_concept_id),
    );

    if (usesExpenseConcept && selectedExpenseConcept) {
      // Keep description populated for legacy screens/reports while
      // expense_concept_id becomes the canonical identifier.
      description = selectedExpenseConcept.name;
    }

    let vendor_id =
      data.vendor_id || data.vendor_id === 0
        ? Number(data.vendor_id) || null
        : null;

    if (mode === "HELPERS") {
      expense_type = "Helpers";
      quantity = Number(data.h_hours) || 0;
      unit = "hour";
      unit_price = Number(data.h_rate) || 0;
      gallons_miles = 0;
      total = helpersTotal;
      vendor_id = null;

      if (!description) {
        const name = (data.h_helper_name || "").trim();
        const task = (data.h_task_project || "").trim();
        description =
          [name, task].filter(Boolean).join(" - ") || "Helpers payment";
      }

      receipt_url = "";
    } else if (mode === "CAR") {
      const type = data.c_expense_type;
      expense_type = type;

      if (type === "Fuel") {
        quantity = gallons || 0;
        unit = "gallon";
        unit_price = cUnitPrice || 0;
        gallons_miles = gallons || 0;
        total = carFuelTotal;
        if (!description) description = "Fuel";
      } else if (type === "Maintenance") {
        quantity = 1;
        unit = "unit";
        unit_price = cUnitPrice || 0;
        gallons_miles = 0;
        total = carMaintTotal;
      } else {
        expense_type = "Other";
        quantity = 1;
        unit = "unit";
        unit_price = cOtherSubtotal || 0;
        gallons_miles = 0;
        total = cOtherTotal;
      }
    } else if (mode === "GENERAL" || mode === "OTHER") {
      expense_type = data.g_expense_type || "General";
      quantity = 1;
      unit = "unit";
      unit_price = gSubtotal || 0;
      gallons_miles = 0;
      total = gTotal;
      receipt_url = "";
    } else if (mode === "SUPPLIES") {
      expense_type = "Supplies";
      quantity = sQty || 0;
      unit = "unit";
      unit_price = sUnitPrice || 0;
      gallons_miles = 0;
      total = suppliesTotal;
      receipt_url = "";
    }

    const apply_tax_final = mode === "HELPERS" ? false : tax_applied;

    const payload = {
      id: expenseToEdit?.id,
      date: data.date,
      category_id: data.category_id ? Number(data.category_id) : null,
      expense_concept_id: usesExpenseConcept ? expense_concept_id : null,
      vendor_id,

      description,
      notes,

      expense_type,
      quantity,
      unit,
      unit_price,
      gallons_miles,

      apply_tax: apply_tax_final,

      payment_method,
      payment_account_id,
      receipt_url,

      total,

      paid: mode === "HELPERS" ? !!data.h_paid : undefined,
      helper_name: mode === "HELPERS" ? data.h_helper_name : undefined,
      task_project: mode === "HELPERS" ? data.h_task_project : undefined,
    };

    console.log("[ExpenseForm] submit payload:", payload);
    await submit?.(payload);

    if (isEditing) {
      onCancelEdit?.();
      reset(makeDefaults());
      return;
    }

    reset({
      date: getValues("date"),
      category_id: getValues("category_id"),
      expense_concept_id: "",
      vendor_id: mode === "HELPERS" ? "" : getValues("vendor_id"),
      payment_method: "",
      payment_account_id: "",
      receipt_url: "",
      description: "",
      notes: "",
      apply_tax: mode === "HELPERS" ? false : apply_tax,

      s_quantity: "",
      s_unit_price: "",

      gallons_miles: "",
      c_unit_price: "",
      c_expense_type: "Fuel",
      c_other_subtotal: "",

      g_subtotal: "",
      g_expense_type: "General",

      h_helper_name: "",
      h_task_project: "",
      h_hours: "",
      h_rate: "",
      h_paid: false,
    });
  };

  const openConceptModal = (suggestedName = "") => {
    if (!categoryId) return;

    setNewConceptName(suggestedName.trim());
    setConceptCreateError("");
    setShowConceptModal(true);
  };

  const closeConceptModal = () => {
    if (createExpenseConcept.isPending) return;

    setShowConceptModal(false);
    setNewConceptName("");
    setConceptCreateError("");
  };

  const handleCreateExpenseConcept = async () => {
    const name = newConceptName.trim();

    if (!categoryId) {
      setConceptCreateError("Select a category first.");
      return;
    }

    if (!name) {
      setConceptCreateError("Concept name is required.");
      return;
    }

    try {
      setConceptCreateError("");

      const created = await createExpenseConcept.mutateAsync({
        category_id: Number(categoryId),
        name,
        is_active: true,
      });

      setLocallyCreatedConcepts((current) => [
        ...current.filter(
          (concept) => String(concept.id) !== String(created.id),
        ),
        created,
      ]);

      setValue("expense_concept_id", String(created.id), {
        shouldDirty: true,
        shouldValidate: false,
      });

      clearErrors("expense_concept_id");

      setShowConceptModal(false);
      setNewConceptName("");
    } catch (error) {
      const detail =
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to create expense concept.";

      setConceptCreateError(detail);
    }
  };

  const handleCancel = () => {
    reset(makeDefaults());
    pendingPaymentAccountIdRef.current = null;
    onCancelEdit?.();
  };

  const SectionHeader = () => (
    <div className="col-12 col-md-3">
      <label className="form-label">Category</label>
      <select className="form-select" {...register("category_id")}>
        <option value="">— Select —</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );

  const renderExpenseConceptField = () => (
    <div className="col-12">
      <input
        type="hidden"
        {...register("expense_concept_id", {
          required: !isEditing ? "Required" : false,
        })}
      />

      <ExpenseConceptSelect
        key={String(categoryId || "no-category")}
        concepts={availableExpenseConcepts}
        value={expenseConceptId}
        onChange={(conceptId) => {
          setValue("expense_concept_id", conceptId, {
            shouldDirty: true,
            shouldValidate: !!conceptId,
          });

          clearErrors("expense_concept_id");
        }}
        onCreate={openConceptModal}
        isLoading={isLoadingExpenseConcepts}
        disabled={!categoryId || createExpenseConcept.isPending}
        error={errors.expense_concept_id?.message}
      />
    </div>
  );

  const CommonTotals = ({ subtotal, tax, total }) => (
    <>
      <div className="col-12 col-md-3">
        <label className="form-label">Subtotal</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            className="form-control"
            value={Number.isFinite(subtotal) ? subtotal : ""}
            readOnly
          />
        </div>
      </div>

      <div className="col-12 col-md-3 d-flex align-items-end">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="applyTax"
            {...register("apply_tax")}
          />
          <label className="form-check-label" htmlFor="applyTax">
            Apply Tax
          </label>
        </div>
      </div>

      <div className="col-12 col-md-3">
        <label className="form-label">Tax (9%)</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            className="form-control"
            value={Number.isFinite(tax) ? tax : ""}
            readOnly
          />
        </div>
      </div>

      <div className="col-12 col-md-3">
        <label className="form-label">Total</label>
        <div className="input-group">
          <span className="input-group-text">$</span>
          <input
            className="form-control fw-bold"
            value={Number.isFinite(total) ? total : ""}
            readOnly
          />
        </div>
      </div>
    </>
  );

  const CommonPayments = ({
    includeReceiptAndNotes,
    paymentAccounts,
    isLoadingAccounts,
  }) => {
    const selectedPaymentAccountId = watch("payment_account_id") || "";

    return (
      <>
        <div className="col-12 col-md-3">
          <label className="form-label">Payment Method</label>
          <select className="form-select" {...register("payment_method")}>
            <option value="">— Optional —</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="BANK">Bank</option>
          </select>
        </div>

        <div className="col-12 col-md-3">
          <label className="form-label d-flex align-items-center gap-2">
            <span>Payment Account</span>
            {isLoadingAccounts ? (
              <span className="spinner-border spinner-border-sm" />
            ) : null}
          </label>

          <select
            className="form-select"
            value={selectedPaymentAccountId}
            onChange={(e) => {
              setValue("payment_account_id", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            disabled={!paymentMethod || isLoadingAccounts}
          >
            <option value="">— Optional —</option>

            {paymentAccounts.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.name}
                {a.provider ? ` · ${a.provider}` : ""}
                {a.last4 ? ` · ••${a.last4}` : ""}
              </option>
            ))}
          </select>
        </div>

        {includeReceiptAndNotes ? (
          <>
            <div className="col-12 col-md-6">
              <label className="form-label">Receipt</label>
              <input
                type="url"
                className="form-control"
                placeholder="https://... o referencia"
                {...register("receipt_url")}
              />
            </div>

            <div className="col-12">
              <label className="form-label">Notes</label>
              <input
                className="form-control"
                placeholder="Detalle adicional"
                {...register("notes")}
              />
            </div>
          </>
        ) : null}
      </>
    );
  };

  return (
    <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
      {isEditing && (
        <div className="col-12">
          <div className="alert alert-info mb-0">
            Editing expense #{expenseToEdit.id}
          </div>
        </div>
      )}

      <SectionHeader />

      {hasCategory && mode === "HELPERS" && (
        <>
          <div className="col-12 col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              {...register("date", { required: true })}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Helper Name</label>
            <input
              className="form-control"
              {...register("h_helper_name", { required: true })}
            />
            {errors.h_helper_name && (
              <div className="text-danger small">Required</div>
            )}
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Task/Project</label>
            <input
              className="form-control"
              {...register("h_task_project")}
              placeholder="House Cleaning, Move-out…"
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Hours Worked</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              {...register("h_hours")}
              placeholder="0.00"
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Hourly Rate</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                {...register("h_rate")}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Total Paid</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                className="form-control fw-bold"
                value={helpersTotal || ""}
                readOnly
              />
            </div>
          </div>

          <div className="col-12 col-md-3 d-flex align-items-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="paidCheck"
                {...register("h_paid")}
              />
              <label className="form-check-label" htmlFor="paidCheck">
                Paid?
              </label>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label">Notes</label>
            <input
              className="form-control"
              placeholder="Worked 2025-09-29 to 2025-10-03"
              {...register("notes")}
            />
          </div>

          <CommonPayments
            includeReceiptAndNotes={false}
            paymentAccounts={paymentAccounts}
            isLoadingAccounts={isLoadingAccounts}
          />
        </>
      )}

      {hasCategory && mode === "CAR" && (
        <>
          <div className="col-12 col-md-3">
            <label className="form-label">Expense Type</label>
            <select className="form-select" {...register("c_expense_type")}>
              <option>Fuel</option>
              <option>Maintenance</option>
              <option>Parts</option>
              <option>Tools & Equipment</option>
              <option>Registration & Fees</option>
              <option>Insurance</option>
              <option>Other</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              {...register("date", { required: true })}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">{vendorLabel}</label>
            <select className="form-select" {...register("vendor_id")}>
              <option value="">— Optional —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {carType === "Fuel" && (
            <>
              <div className="col-12 col-md-3">
                <label className="form-label">Gallons</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="form-control"
                  {...register("gallons_miles")}
                  placeholder="e.g., 12.5"
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label">Unit Price</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className={`form-control ${
                      errors.c_unit_price ? "is-invalid" : ""
                    }`}
                    {...register("c_unit_price", {
                      validate: (v) =>
                        v === "" || Number(v) >= 0 ? true : "Debe ser ≥ 0",
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <CommonTotals
                subtotal={carFuelSubtotal}
                tax={carFuelTax}
                total={carFuelTotal}
              />

              <CommonPayments
                includeReceiptAndNotes
                paymentAccounts={paymentAccounts}
                isLoadingAccounts={isLoadingAccounts}
              />
            </>
          )}

          {carType === "Maintenance" && (
            <>
              {renderExpenseConceptField()}

              <div className="col-12 col-md-3">
                <label className="form-label">Price</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control ${
                      errors.c_unit_price ? "is-invalid" : ""
                    }`}
                    {...register("c_unit_price", {
                      validate: (v) =>
                        v === "" || Number(v) >= 0 ? true : "Debe ser ≥ 0",
                    })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <CommonTotals
                subtotal={carMaintSubtotal}
                tax={carMaintTax}
                total={carMaintTotal}
              />

              <CommonPayments
                includeReceiptAndNotes
                paymentAccounts={paymentAccounts}
                isLoadingAccounts={isLoadingAccounts}
              />
            </>
          )}

          {carType === "Other" && (
            <>
              {renderExpenseConceptField()}

              <div className="col-12 col-md-3">
                <label className="form-label">Subtotal</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    {...register("c_other_subtotal")}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <CommonTotals
                subtotal={cOtherSubtotal}
                tax={cOtherTax}
                total={cOtherTotal}
              />

              <CommonPayments
                includeReceiptAndNotes
                paymentAccounts={paymentAccounts}
                isLoadingAccounts={isLoadingAccounts}
              />
            </>
          )}
        </>
      )}

      {hasCategory && (mode === "GENERAL" || mode === "OTHER") && (
        <>
          <div className="col-12 col-md-3">
            <label className="form-label">Expense Type</label>
            <select className="form-select" {...register("g_expense_type")}>
              <option>General</option>
              <option>Insurance</option>
              <option>Legal/Government Fees</option>
              <option>Marketing</option>
              <option>Utilities</option>
              <option>Service</option>
              <option>Other</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              {...register("date", { required: true })}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">{vendorLabel}</label>
            <select
              className="form-select"
              {...register("vendor_id", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            >
              <option value="">— Optional —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {renderExpenseConceptField()}

          <div className="col-12">
            <label className="form-label">Notes</label>
            <input
              className="form-control"
              placeholder="Optional details"
              {...register("notes")}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Subtotal</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                {...register("g_subtotal")}
                placeholder="0.00"
              />
            </div>
          </div>

          <CommonTotals subtotal={gSubtotal} tax={gTax} total={gTotal} />

          <CommonPayments
            includeReceiptAndNotes={false}
            paymentAccounts={paymentAccounts}
            isLoadingAccounts={isLoadingAccounts}
          />
        </>
      )}

      {hasCategory && mode === "SUPPLIES" && (
        <>
          <div className="col-12 col-md-3">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              {...register("date", { required: true })}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">{vendorLabel}</label>
            <select
              className="form-select"
              {...register("vendor_id", {
                setValueAs: (v) => (v === "" ? null : Number(v)),
              })}
            >
              <option value="">— Optional —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {renderExpenseConceptField()}

          <div className="col-12">
            <label className="form-label">Notes</label>
            <input
              className="form-control"
              placeholder="Optional details, size, presentation, etc."
              {...register("notes")}
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              step="1"
              min="0"
              className="form-control"
              {...register("s_quantity")}
              placeholder="0"
            />
          </div>

          <div className="col-12 col-md-3">
            <label className="form-label">Unit Price</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-control ${
                  errors.s_unit_price ? "is-invalid" : ""
                }`}
                {...register("s_unit_price", {
                  validate: (v) =>
                    v === "" || Number(v) >= 0 ? true : "Debe ser ≥ 0",
                })}
                placeholder="0.00"
              />
            </div>
          </div>

          <CommonTotals
            subtotal={suppliesSubtotal}
            tax={suppliesTax}
            total={suppliesTotal}
          />

          <CommonPayments
            includeReceiptAndNotes={false}
            paymentAccounts={paymentAccounts}
            isLoadingAccounts={isLoadingAccounts}
          />
        </>
      )}

      {hasCategory && (
        <div className="col-12 d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            className="btn btn-primary"
            disabled={isSubmitting || !hasCategory}
          >
            <i
              className={`bi ${
                isEditing ? "bi-pencil-square" : "bi-plus-circle"
              } me-2`}
            />

            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Saving..."
              : isEditing
                ? "Update"
                : "Save"}
          </button>
        </div>
      )}

      {showConceptModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add an Expense Concept</h5>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeConceptModal}
                    disabled={createExpenseConcept.isPending}
                  />
                </div>

                <div className="modal-body">
                  <p className="text-muted">
                    Add a concept for{" "}
                    <strong>{selectedCategory?.name || "this category"}</strong>
                    .
                  </p>

                  <label className="form-label">Concept</label>

                  <input
                    className={`form-control ${
                      conceptCreateError ? "is-invalid" : ""
                    }`}
                    value={newConceptName}
                    onChange={(event) => {
                      setNewConceptName(event.target.value);
                      setConceptCreateError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleCreateExpenseConcept();
                      }
                    }}
                    autoFocus
                    maxLength={150}
                    disabled={createExpenseConcept.isPending}
                  />

                  {conceptCreateError && (
                    <div className="invalid-feedback">{conceptCreateError}</div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeConceptModal}
                    disabled={createExpenseConcept.isPending}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCreateExpenseConcept}
                    disabled={
                      createExpenseConcept.isPending || !newConceptName.trim()
                    }
                  >
                    {createExpenseConcept.isPending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </form>
  );
}
