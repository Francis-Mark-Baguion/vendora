interface SetupLayoutProps {
    children : React.ReactNode;
}
const SetupLayout = ({ children }: SetupLayoutProps) => {
    return (
        <div>
           {children}
        </div>
    )
}