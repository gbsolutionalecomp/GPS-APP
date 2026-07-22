import type { OdometerEvidence } from '@/domain/types'
import { getDataMode } from '@/lib/env'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export interface ReportImage {
  bytes: Uint8Array
  extension: 'png' | 'jpeg'
}

function extensionFromPath(path: string): ReportImage['extension'] | null {
  const extension = path.split('.').pop()?.toLowerCase()
  if (extension === 'png') return 'png'
  if (extension === 'jpg' || extension === 'jpeg') return 'jpeg'
  return null
}

export async function loadEvidenceImage(evidence?: OdometerEvidence): Promise<ReportImage | null> {
  if (!evidence?.storagePath || getDataMode() === 'demo') return null
  const extension = extensionFromPath(evidence.storagePath)
  if (!extension) return null
  const { data, error } = await getSupabaseAdminClient().storage.from('odometer-evidence').download(evidence.storagePath)
  if (error || !data) return null
  return { bytes: new Uint8Array(await data.arrayBuffer()), extension }
}
