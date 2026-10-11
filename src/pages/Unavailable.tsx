import { Link } from 'react-router-dom';
export default function Unavailable({ message = 'Page not found.' }: { message?: string }) {
  return <div className="mx-auto max-w-lg py-16 text-center"><h1 className="text-2xl font-bold">{message}</h1><Link className="mt-6 inline-block text-indigo-700 underline" to="/">Back to AyahVault</Link></div>;
}
