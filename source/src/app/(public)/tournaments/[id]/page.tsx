import{TournamentDetail}from"@/pages";export default async function Page({params}:{params:Promise<{id:string}>}){return <TournamentDetail id={(await params).id}/>}
