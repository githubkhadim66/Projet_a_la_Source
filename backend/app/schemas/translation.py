from typing import Literal

from pydantic import BaseModel

TranslationStatus = Literal["manual", "glossary", "auto", "missing"]


class FieldTranslation(BaseModel):
    field: str
    source: str
    translated: str
    # manual = corrigée par l'admin · glossary = libellé validé (non modifiable ici)
    # auto = DeepL · missing = pas encore traduite (clé DeepL absente ou indisponible)
    status: TranslationStatus
    editable: bool


class ProductTranslationOut(BaseModel):
    product_id: int
    ref: str
    lang: str
    fields: list[FieldTranslation]


class ProductTranslationUpdate(BaseModel):
    """Corrections par champ : un texte = traduction imposée ; null = revenir à l'automatique."""

    fields: dict[str, str | None]


class CatalogueTranslationRow(BaseModel):
    product_id: int
    ref: str
    image: str
    name: str
    name_translated: str
    manual_count: int
    missing_count: int
