import { useState, useEffect } from 'react'
import { Plus, Trash2, AlertCircle, Save } from 'lucide-react'
import Modal from './Modal'
import api from '../api/client'
import { METRICI, TIPURI_DISPOZITIV } from '../utils/metrici'

const FORM_GOL = { cod_dispozitiv: '', nume: '', tip: 'senzor', locatie: '', descriere: '' }

function pragInArray(praguri) {
  if (!praguri) return []
  return Object.entries(praguri).map(([metrica, val]) => ({
    metrica,
    min: val?.min ?? '',
    max: val?.max ?? '',
  }))
}

export default function DeviceModal({ deschis, onInchide, dispozitiv, onSalvat }) {
  const eDeEditare = Boolean(dispozitiv)
  const [form, setForm] = useState(FORM_GOL)
  const [praguri, setPraguri] = useState([])
  const [eroare, setEroare] = useState('')
  const [seTrimite, setSeTrimite] = useState(false)

  useEffect(() => {
    if (!deschis) return
    setEroare('')
    if (dispozitiv) {
      setForm({
        cod_dispozitiv: dispozitiv.cod_dispozitiv || '',
        nume: dispozitiv.nume || '',
        tip: dispozitiv.tip || 'senzor',
        locatie: dispozitiv.locatie || '',
        descriere: dispozitiv.descriere || '',
      })
      setPraguri(pragInArray(dispozitiv.praguri))
    } else {
      setForm(FORM_GOL)
      setPraguri([])
    }
  }, [deschis, dispozitiv])

  const modifica = (camp) => (e) => setForm((f) => ({ ...f, [camp]: e.target.value }))

  const adaugaPrag = () => setPraguri((p) => [...p, { metrica: 'temperatura', min: '', max: '' }])
  const stergePrag = (i) => setPraguri((p) => p.filter((_, idx) => idx !== i))
  const modificaPrag = (i, camp, val) =>
    setPraguri((p) => p.map((row, idx) => (idx === i ? { ...row, [camp]: val } : row)))

  const construiestePraguri = () => {
    const obj = {}
    for (const row of praguri) {
      if (!row.metrica) continue
      const intrare = {}
      if (row.min !== '' && row.min !== null) intrare.min = Number(row.min)
      if (row.max !== '' && row.max !== null) intrare.max = Number(row.max)
      if (Object.keys(intrare).length) obj[row.metrica] = intrare
    }
    return obj
  }

  const trimite = async (e) => {
    e.preventDefault()
    setEroare('')
    setSeTrimite(true)
    try {
      const payload = {
        nume: form.nume,
        tip: form.tip,
        locatie: form.locatie,
        descriere: form.descriere,
        praguri: construiestePraguri(),
      }
      let raspuns
      if (eDeEditare) {
        raspuns = await api.put(`/dispozitive/${dispozitiv.id}`, payload)
      } else {
        raspuns = await api.post('/dispozitive', {
          ...payload,
          cod_dispozitiv: form.cod_dispozitiv,
        })
      }
      onSalvat(raspuns.data, eDeEditare)
      onInchide()
    } catch (err) {
      setEroare(err?.response?.data?.eroare || 'Salvarea a eșuat.')
    } finally {
      setSeTrimite(false)
    }
  }

  return (
    <Modal
      deschis={deschis}
      onInchide={onInchide}
      titlu={eDeEditare ? 'Editează dispozitivul' : 'Adaugă dispozitiv nou'}
    >
      {eroare && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {eroare}
        </div>
      )}

      <form onSubmit={trimite} className="space-y-4">
        <div>
          <label className="label">Cod dispozitiv (identificator MQTT)</label>
          <input
            className="input font-mono disabled:bg-slate-100"
            value={form.cod_dispozitiv}
            onChange={modifica('cod_dispozitiv')}
            placeholder="ex: rasp-pi-salon"
            disabled={eDeEditare}
            required
          />
          {!eDeEditare && (
            <p className="mt-1 text-xs text-slate-400">
              Folosit în topicul MQTT: <code>iot/&lt;cod&gt;/telemetry</code>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nume</label>
            <input
              className="input"
              value={form.nume}
              onChange={modifica('nume')}
              placeholder="ex: Senzor salon"
              required
            />
          </div>
          <div>
            <label className="label">Tip</label>
            <select className="input" value={form.tip} onChange={modifica('tip')}>
              {Object.entries(TIPURI_DISPOZITIV).map(([cheie, info]) => (
                <option key={cheie} value={cheie}>
                  {info.eticheta}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Locație</label>
          <input
            className="input"
            value={form.locatie}
            onChange={modifica('locatie')}
            placeholder="ex: Salon, Etaj 1"
          />
        </div>

        <div>
          <label className="label">Descriere</label>
          <textarea
            className="input min-h-[72px] resize-y"
            value={form.descriere}
            onChange={modifica('descriere')}
            placeholder="Detalii despre dispozitiv și senzori..."
          />
        </div>

        {/* Editor praguri de alertare */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Praguri de alertare</label>
            <button
              type="button"
              onClick={adaugaPrag}
              className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              <Plus className="h-4 w-4" /> Adaugă prag
            </button>
          </div>

          {praguri.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-3 text-center text-xs text-slate-400">
              Niciun prag configurat. Adaugă unul pentru a primi alerte la depășire.
            </p>
          ) : (
            <div className="space-y-2">
              {praguri.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className="input flex-1"
                    value={row.metrica}
                    onChange={(e) => modificaPrag(i, 'metrica', e.target.value)}
                  >
                    {Object.entries(METRICI).map(([cheie, info]) => (
                      <option key={cheie} value={cheie}>
                        {info.eticheta}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="any"
                    className="input w-24"
                    value={row.min}
                    onChange={(e) => modificaPrag(i, 'min', e.target.value)}
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    step="any"
                    className="input w-24"
                    value={row.max}
                    onChange={(e) => modificaPrag(i, 'max', e.target.value)}
                    placeholder="Max"
                  />
                  <button
                    type="button"
                    onClick={() => stergePrag(i)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onInchide} className="btn-secondary">
            Anulează
          </button>
          <button type="submit" className="btn-primary" disabled={seTrimite}>
            <Save className="h-4 w-4" />
            {seTrimite ? 'Se salvează...' : eDeEditare ? 'Salvează modificările' : 'Adaugă dispozitiv'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
