const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background py-6 mt-8">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Amigo do Peito. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;