import PasswordForm from "./PasswordForm";

export default function ComptePage() {
  return (
    <section className="section">
      <div className="crumb">Mon compte</div>
      <h1>Mon compte</h1>
      <div className="pagesub">Gère ton mot de passe de connexion</div>
      <PasswordForm />
    </section>
  );
}
