"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Register(){
  const [form, setForm] = useState({name:"", county:"Bomet", position:"MCA", phone:"", password:"", party:""})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e:any)=>{
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/register",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form)})
    const data = await res.json()
    setLoading(false)
    if(res.ok){ router.push("/login?registered=1") }
    else{ alert(data.error || "Failed") }
  }

  return(
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-[440px] bg-[#111] border border-white/10 rounded-2xl p-8">
        <div className="w-8 h-8 rounded-full bg-[#00ff66] flex items-center justify-center text-black font-black">P</div>
        <h1 className="mt-4 text-2xl font-bold">Create Private Profile</h1>
        <p className="text-sm text-white/50 mt-1">Only you will see your mentions. 7-day free trial.</p>

        <div className="mt-6 space-y-4">
          <input required placeholder="Full Name - e.g. HON BENARD NGENO" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>
          <div className="grid grid-cols-2 gap-3">
            <select className="px-4 py-3 rounded-xl bg-black border border-white/10" value={form.county} onChange={e=>setForm({...form, county:e.target.value})}>
              <option>Bomet</option><option>Nairobi</option><option>Kisumu</option><option>Nakuru</option><option>Mombasa</option><option>Kajiado</option><option>Kericho</option>
            </select>
            <select className="px-4 py-3 rounded-xl bg-black border border-white/10" value={form.position} onChange={e=>setForm({...form, position:e.target.value})}>
              <option>MCA</option><option>MP</option><option>Senator</option><option>Governor</option><option>Woman Rep</option>
            </select>
          </div>
          <input placeholder="Party (optional)" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.party} onChange={e=>setForm({...form, party:e.target.value})}/>
          <input required placeholder="Phone - 07xx xxx xxx" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/>
          <input required type="password" placeholder="Password - min 6 chars" className="w-full px-4 py-3 rounded-xl bg-black border border-white/10" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
        </div>

        <button disabled={loading} className="mt-6 w-full py-3.5 rounded-xl bg-[#00ff66] text-black font-bold disabled:opacity-50">{loading? "Creating..." : "Create Profile →"}</button>
        <div className="mt-4 text-center text-sm text-white/40">Already have account? <Link href="/login" className="text-white underline">Login</Link></div>
        <div className="mt-3 text-[10px] text-center text-white/30">🔒 Private • Encrypted • is_demo=false • Entitlements: BASIC</div>
      </form>
    </div>
  )
}