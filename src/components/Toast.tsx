import { useStore } from '../store'
import { css } from '../logic'

export function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div style={css("position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2B2520;color:#F4EEE4;padding:13px 22px;border-radius:12px;font:600 14px 'Hanken Grotesk';box-shadow:0 10px 30px rgba(43,37,32,.25);z-index:200;animation:toastIn .3s ease")}>
      {toast}
    </div>
  )
}
