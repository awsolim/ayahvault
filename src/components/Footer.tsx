// src/components/Footer.tsx

export default function Footer() {
  return (
    <footer className="mt-12 py-6 text-center text-sm text-gray-500">
      <div>© {new Date().getFullYear()} Amr Soliman</div>
      <div>
        <a href="mailto:awsolim@gmail.com" className="hover:text-gray-700 underline" >
          awsolim@gmail.com
        </a>
      </div>
    </footer>
  );
}
