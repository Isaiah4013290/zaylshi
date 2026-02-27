const handleConfirm = () => {
  if (!selectedPick) { setError('Select an option first'); return }
  if (wager < 5) { setError('Minimum wager is 5🪙'); return }
  if (wager > publicCoins) { setError('Not enough coins'); return }
  setError('')
  startTransition(async () => {
    const res = await fetch('/api/public/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, pick: selectedPick, wager }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }

    // Use exact values returned from server
    setCoinsA(data.coins_a)
    setCoinsB(data.coins_b)
    setVotersA(selectedPick === 'a' ? (votersA + 1) : votersA)
    setVotersB(selectedPick === 'b' ? (votersB + 1) : votersB)
    setTotalVoters((prev: number) => prev + 1)
    onPickMade(question.id, { pick: selectedPick, wager }, publicCoins - wager)
  })
}
