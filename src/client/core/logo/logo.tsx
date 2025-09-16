const Logo = () => (
  <div className="flex items-center gap-3">
    <img
      src="/logo.svg"
      alt="Nano Studio Logo"
      width="32"
      height="32"
      className="flex-shrink-0"
    />
    
    <div className="flex flex-col">
      <span className="text-lg font-bold text-foreground leading-tight">Nano Studio</span>
    </div>
  </div>
);

export default Logo;