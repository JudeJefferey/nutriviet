/**
 * Chia calo thành 3 nhóm chất (macro): protein, chất béo, carb.
 */
import {
  KCAL_MOI_GAM,
  PROTEIN_G_PER_KG,
  PROTEIN_THEM_KHI_CHOI_THE_THAO,
  TI_LE_CHAT_BEO,
} from "@/lib/config";
import type { MucTieu } from "./types";
import { assertPositive } from "./validate";

export interface Macros {
  proteinG: number;
  fatG: number;
  carbG: number;
  proteinKcal: number;
  fatKcal: number;
  carbKcal: number;
  proteinGPerKg: number; // để giải thích "vì sao ra con số này"
}

/**
 * Cách tính:
 *  1. Protein (g) = g/kg theo mục tiêu (+0.2 nếu chơi thể thao) × cân nặng
 *  2. Chất béo  = 25% tổng calo → chia 9 ra gam
 *  3. Carb      = phần calo còn lại → chia 4 ra gam (không âm)
 */
export function calcMacros(params: {
  kcal: number;
  canNangKg: number;
  mucTieu: MucTieu;
  coChoiTheThao: boolean;
}): Macros {
  const { kcal, canNangKg, mucTieu, coChoiTheThao } = params;
  assertPositive(kcal, "calo");
  assertPositive(canNangKg, "cân nặng");

  const proteinGPerKg =
    PROTEIN_G_PER_KG[mucTieu] +
    (coChoiTheThao ? PROTEIN_THEM_KHI_CHOI_THE_THAO : 0);

  const proteinG = proteinGPerKg * canNangKg;
  const proteinKcal = proteinG * KCAL_MOI_GAM.protein;

  const fatKcal = kcal * TI_LE_CHAT_BEO;
  const fatG = fatKcal / KCAL_MOI_GAM.fat;

  // Phần còn lại cho carb; nếu protein quá cao làm phần này âm thì để 0
  const carbKcal = Math.max(0, kcal - proteinKcal - fatKcal);
  const carbG = carbKcal / KCAL_MOI_GAM.carb;

  return { proteinG, fatG, carbG, proteinKcal, fatKcal, carbKcal, proteinGPerKg };
}
