import Navbar from "@/components/ui/navbar"; // Import the Navbar component

interface SetupLayoutProps {
  children: React.ReactNode;
}

const SetupLayout = ({ children }: SetupLayoutProps) => {
  return (
    <div className="m-0 p-0">
      <Navbar /> {/* Navbar is added here */}
      <main className="mt-16">{children}</main> {/* Push content below fixed navbar */}
    </div>
  );
};

export default SetupLayout;
