$('#backToLast').on('click', function() {
    window.history.back();
});

$('#view').on('click', function() {
    const raidId = $(this).data('raid-id');
    window.location.href = `/party/${raidId}`;
});