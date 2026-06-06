"use client";

import type { Locale } from "payload";
import type { PropsWithChildren } from "react";

import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
import { Button, Pill, useTranslation } from "@payloadcms/ui";

import type {
  TranslationsKey,
  TranslationsObject,
} from "../../translations/types.js";
import type { AllLocalesText } from "./translations-field-label-types.js";

import { cn } from "../../common/cn.js";
import { SparklesIcon } from "../../common/icons.js";
import { Label } from "./labels.js";
import styles from "./translations-field-label.module.css";

type TranslationsTableProps = {
  currentLocale: Locale;
  data: AllLocalesText;
  isTranslating: boolean;
  onAutoTranslateClick: () => void;
  onClose: () => void;
  otherLocales: Locale[];
};

export function TranslationsTable({
  currentLocale,
  data,
  isTranslating,
  onAutoTranslateClick,
  onClose,
  otherLocales,
}: TranslationsTableProps) {
  const { t } = useTranslation<TranslationsObject, TranslationsKey>();
  const showWideColumns = isLongContent(data, currentLocale.code);

  return (
    <div className="table">
      <div className={styles.tableWrapper}>
        <table cellPadding="0" cellSpacing="0">
          <thead>
            <tr>
              <TableHeaderFooterCell
                isHighlighted={true}
                isStickyLeft={true}
                isStickyTop={true}
              >
                <Label>{currentLocale.label}</Label>
                <Pill rounded={true}>
                  {t("cmsPlugin:translations:currentLocale")}
                </Pill>
              </TableHeaderFooterCell>
              {otherLocales.map((locale) => (
                <TableHeaderFooterCell isStickyTop={true} key={locale.code}>
                  <Label>{locale.label}</Label>
                </TableHeaderFooterCell>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <TableContentCell
                isHighlighted={true}
                isStickyLeft={true}
                isWide={showWideColumns}
              >
                <AllLocalesTextRenderer
                  data={data}
                  localeCode={currentLocale.code}
                />
              </TableContentCell>
              {otherLocales.map((locale) => (
                <TableContentCell isWide={showWideColumns} key={locale.code}>
                  <AllLocalesTextRenderer
                    data={data}
                    localeCode={locale.code}
                  />
                </TableContentCell>
              ))}
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <TableHeaderFooterCell
                isHighlighted={true}
                isStickyBottom={true}
                isStickyLeft={true}
              >
                <Button
                  buttonStyle="primary"
                  disabled={isTranslating}
                  icon={<SparklesIcon />}
                  onClick={onAutoTranslateClick}
                  size="medium"
                >
                  {t("cmsPlugin:translations:autoTranslate")}
                </Button>
              </TableHeaderFooterCell>
              {otherLocales.map((locale) => (
                <TableHeaderFooterCell isStickyBottom={true} key={locale.code}>
                  <Button
                    buttonStyle="secondary"
                    disabled={isTranslating}
                    el="link"
                    icon="edit"
                    onClick={() => onClose()}
                    size="medium"
                    to={`?locale=${encodeURIComponent(locale.code)}`}
                  >
                    {t("cmsPlugin:translations:goToTranslation")}
                  </Button>
                </TableHeaderFooterCell>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

type TableHeaderCellProps = PropsWithChildren<{
  isHighlighted?: boolean;
  isStickyBottom?: boolean;
  isStickyLeft?: boolean;
  isStickyTop?: boolean;
}>;

function TableHeaderFooterCell({
  children,
  isHighlighted = false,
  isStickyBottom = false,
  isStickyLeft = false,
  isStickyTop = false,
}: TableHeaderCellProps) {
  return (
    <th
      className={cn(
        styles.tableHeaderFooterCell,
        isHighlighted
          ? styles.tableHeaderFooterCellHighlighted
          : styles.tableHeaderFooterCellNonHighlighted,
        isStickyLeft && styles.tableHeaderFooterCellStickyLeft,
        isStickyTop && styles.tableHeaderFooterCellStickyTop,
        isStickyBottom && styles.tableHeaderFooterCellStickyBottom,
        isStickyTop &&
          isStickyLeft &&
          styles.tableHeaderFooterCellStickyTopLeft,
        isStickyBottom &&
          isStickyLeft &&
          styles.tableHeaderFooterCellStickyBottomLeft,
      )}
    >
      <div>{children}</div>
    </th>
  );
}

type TableContentCellProps = PropsWithChildren<{
  isHighlighted?: boolean;
  isStickyLeft?: boolean;
  isWide?: boolean;
}>;

function TableContentCell({
  children,
  isHighlighted = false,
  isStickyLeft = false,
  isWide,
}: TableContentCellProps) {
  return (
    <td
      className={cn(
        styles.tableContentCell,
        isWide ? styles.tableContentCellWide : styles.tableContentCellNonWide,
        isHighlighted && styles.highlighted,
        isStickyLeft && styles.stickyLeft,
      )}
    >
      {children}
    </td>
  );
}

type AllLocalesTextRendererProps = {
  data: AllLocalesText;
  localeCode: string;
};

function AllLocalesTextRenderer({
  data,
  localeCode,
}: AllLocalesTextRendererProps) {
  if (!data.value) {
    return null;
  }

  const text = data.value[localeCode];
  if (text == null) {
    return null;
  }

  return (
    <>
      {typeof text === "string" ? (
        text
      ) : (
        <div
          className={styles.richTextHtml}
          dangerouslySetInnerHTML={{
            __html: convertLexicalToHTML({
              data: text,
            }),
          }}
          lang={localeCode}
        />
      )}
    </>
  );
}

function isLongContent(data: AllLocalesText, localeCode: string) {
  if (!data.value) {
    return false;
  }

  const text = data.value[localeCode];
  if (text == null) {
    return false;
  }

  const plainText =
    typeof text === "string"
      ? text
      : convertLexicalToPlaintext({
          data: text,
        });
  return !!plainText && plainText.length > 200;
}
