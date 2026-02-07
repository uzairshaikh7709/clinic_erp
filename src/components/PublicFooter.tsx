import Link from 'next/link'

export default function PublicFooter() {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 py-4 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                <p className="text-slate-500 text-sm">© 2026 OrthoClinic. All rights reserved.</p>
                <div className="flex gap-6 text-sm text-slate-500">
                    <Link href="#" className="hover:text-[#0077B6]">Privacy</Link>
                    <Link href="#" className="hover:text-[#0077B6]">Terms</Link>
                    <Link href="#" className="hover:text-[#0077B6]">Contact</Link>
                </div>
            </div>
        </footer>
    )
}
