
import Header from "../components/Header";
import Footer from "../components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-ap-light-orange to-white">
        <div className="ap-container">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Sobre Nós</h1>
            <p className="text-xl text-gray-700">
              Conheça a história e a missão por trás da plataforma Amigo do Peito
            </p>
          </div>
        </div>
      </section>
      
      {/* Founder Section */}
      <section className="section bg-card">
        <div className="ap-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/lovable-uploads/07ee9a5d-7ae4-498b-be27-a07561f8c0bb.png" 
                alt="Renaldo Rezende - Fundador" 
                className="w-full h-auto rounded-lg shadow-xl"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4">Nossa História</h2>
              <p className="text-gray-700 mb-6">
                A Amigo do Peito foi fundada por Renaldo Rezende com o objetivo de revolucionar a forma como profissionais de saúde estética se conectam com seus clientes.
              </p>
              <p className="text-gray-700 mb-6">
                Após anos de experiência no mercado, Renaldo identificou uma lacuna: profissionais talentosos muitas vezes lutavam para atrair novos clientes, enquanto consumidores buscavam serviços de qualidade a preços acessíveis.
              </p>
              <p className="text-gray-700">
                A solução foi criar um sistema inovador de marketing multinível que beneficia ambas as partes, tornando os serviços mais acessíveis e aumentando o alcance dos profissionais.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Mission Section */}
      <section className="section bg-ap-light-orange">
        <div className="ap-container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Nossa Missão</h2>
            <p className="text-xl text-gray-700 mb-8">
              Conectar profissionais de excelência com clientes que buscam serviços de qualidade, criando uma rede de indicações que beneficie a todos os envolvidos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                {
                  title: "Qualidade",
                  description: "Garantir que apenas profissionais qualificados façam parte da nossa rede",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )
                },
                {
                  title: "Acessibilidade",
                  description: "Tornar serviços de qualidade mais acessíveis através do sistema de indicações",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )
                },
                {
                  title: "Transparência",
                  description: "Operar com total transparência em todas as transações e processos",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-ap-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                  )
                }
              ].map((value, index) => (
                <div key={index} className="bg-card p-6 rounded-lg shadow-md">
                  <div className="mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Ambassadors Section */}
      <section className="section bg-card">
        <div className="ap-container">
          <h2 className="text-3xl font-bold text-center mb-10">Nossos Embaixadores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="text-center">
              <img 
                src="/lovable-uploads/910e3e91-4363-4ada-849c-1b2d717d404a.png" 
                alt="Charles Ferreira" 
                className="w-48 h-48 object-cover rounded-full mx-auto mb-4 shadow-md"
              />
              <h3 className="text-xl font-bold mb-2">Charles Ferreira</h3>
              <p className="text-ap-orange font-medium mb-4">Embaixador dos Tatuadores</p>
              <p className="text-gray-700 max-w-md mx-auto">
                Charles é um tatuador renomado com anos de experiência na área. Como embaixador, ele representa os profissionais da tatuagem e ajuda a garantir a qualidade dos serviços oferecidos na plataforma.
              </p>
            </div>
            
            <div className="text-center">
              <img 
                src="/lovable-uploads/91e2caa6-e4d2-4fbd-9cb8-646d49d0827f.png" 
                alt="Chaele Ferreira" 
                className="w-48 h-48 object-cover rounded-full mx-auto mb-4 shadow-md"
              />
              <h3 className="text-xl font-bold mb-2">Chaele Ferreira</h3>
              <p className="text-ap-orange font-medium mb-4">Embaixadora dos Dentistas</p>
              <p className="text-gray-700 max-w-md mx-auto">
                Especialista em lentes de contato dental, Chaele traz sua expertise para representar os profissionais da odontologia estética. Como embaixadora, ela garante que os serviços prestados sigam os mais altos padrões de qualidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
