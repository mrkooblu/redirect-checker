import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    font-family: ${props => props.theme.fonts.family.primary};
    font-weight: ${props => props.theme.fonts.weights.regular};
    font-size: ${props => props.theme.heading.body.fontSize};
    line-height: ${props => props.theme.heading.body.lineHeight};
    color: ${props => props.theme.colors.text.primary};
    background-color: ${props => props.theme.colors.background.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    transition: ${props => props.theme.transition.default};
    
    &:hover {
      text-decoration: underline;
    }
  }

  button, input, select, textarea {
    font-family: ${props => props.theme.fonts.family.primary};
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  }

  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    color: ${props => props.theme.colors.text.primary};
  }

  h1 {
    font-weight: ${props => props.theme.heading.h1.fontWeight};
    font-size: ${props => props.theme.heading.h1.fontSize};
    line-height: ${props => props.theme.heading.h1.lineHeight};
    margin-bottom: ${props => props.theme.spacing.md};
  }

  h2 {
    font-weight: ${props => props.theme.heading.h2.fontWeight};
    font-size: ${props => props.theme.heading.h2.fontSize};
    line-height: ${props => props.theme.heading.h2.lineHeight};
    margin-bottom: ${props => props.theme.spacing.md};
  }

  h3 {
    font-weight: ${props => props.theme.heading.h3.fontWeight};
    font-size: ${props => props.theme.heading.h3.fontSize};
    line-height: ${props => props.theme.heading.h3.lineHeight};
    margin-bottom: ${props => props.theme.spacing.sm};
  }

  p {
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.text.secondary};
  }

  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 ${props => props.theme.spacing.md};
  }

  /* Status code colors */
  .status-2xx {
    color: ${props => props.theme.colors.success};
  }
  
  .status-3xx {
    color: ${props => props.theme.colors.info};
  }
  
  .status-4xx {
    color: ${props => props.theme.colors.warning};
  }
  
  .status-5xx {
    color: ${props => props.theme.colors.error};
  }

  /* Code/technical display */
  .code-font {
    font-family: ${props => props.theme.fonts.family.mono};
    font-size: ${props => props.theme.fontSizes.sm};
  }

  /* Table styles */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: ${props => props.theme.spacing.lg};
  }

  th, td {
    text-align: left;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    border-bottom: 1px solid ${props => props.theme.colors.border};
  }

  th {
    font-weight: ${props => props.theme.fonts.weights.semibold};
    background-color: ${props => props.theme.colors.background.secondary};
  }

  tr:hover {
    background-color: ${props => props.theme.colors.background.secondary};
  }
`;

export default GlobalStyle; 