"use client";

import type { TextFieldClientProps } from "payload";

import {
  CheckboxInput,
  FieldDescription,
  FieldLabel,
  TextInput,
  useDocumentInfo,
  useField,
  useForm,
  useFormFields,
  useTranslation,
} from "@payloadcms/ui";

import type {
  TranslationsKey,
  TranslationsObject,
} from "../../translations/types.js";

import styles from "./pathname-field.module.css";

export function PathnameField({ field, path }: TextFieldClientProps) {
  const { initialValue, setValue, showError, value } = useField<string>({
    path,
  });
  const { id } = useDocumentInfo();

  const { dispatchFields } = useForm();
  const [isLocked, createRedirect] = useFormFields(([fields]) => {
    return [
      fields["pathname_locked"].value as boolean,
      fields["pathname_createRedirect"].value as boolean,
    ];
  });

  const { t } = useTranslation<TranslationsObject, TranslationsKey>();

  const hasExistingPage = Boolean(id);
  const hasInitialPathname =
    typeof initialValue === "string" && initialValue.length > 0;
  const shouldShowCreateRedirect =
    hasExistingPage && hasInitialPathname && initialValue !== value;

  return (
    <div className="field-type">
      <div className={styles.header}>
        <FieldLabel
          label={field.label}
          localized={field.localized}
          path={path}
          required={field.required}
        />

        {hasExistingPage && (
          <button
            className={styles.lockButton}
            onClick={() =>
              dispatchFields({
                type: "UPDATE",
                path: "pathname_locked",
                value: !isLocked,
              })
            }
            type="button"
          >
            {isLocked
              ? t("cmsPlugin:pages:pathname:unlock")
              : t("cmsPlugin:pages:pathname:lock")}
          </button>
        )}
      </div>

      <TextInput
        localized={field.localized}
        onChange={setValue}
        path={path}
        placeholder={field.admin?.placeholder}
        readOnly={hasExistingPage && isLocked}
        required={field.required}
        showError={showError}
        value={value}
      />
      {shouldShowCreateRedirect && (
        <CheckboxInput
          checked={createRedirect}
          className={styles.createRedirectCheckbox}
          id="field-pathname_createRedirect"
          Label={
            <FieldLabel
              label={t("cmsPlugin:pages:pathname:createRedirect", {
                previousPathname: initialValue,
              })}
              path="pathname_createRedirect"
            />
          }
          onToggle={(e) =>
            dispatchFields({
              type: "UPDATE",
              path: "pathname_createRedirect",
              value: e.currentTarget.checked,
            })
          }
        />
      )}

      <FieldDescription description={field.admin?.description} path={path} />
    </div>
  );
}
